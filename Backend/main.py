import os
import json
import asyncio
import traceback
from urllib.parse import urlencode

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from websockets.asyncio.client import connect as ws_connect
from websockets.exceptions import ConnectionClosed
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()
API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

if not API_KEY or not OPENAI_API_KEY:
    print("❌ Missing API keys in .env file.")
    exit(1)

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# Split by comma to support multiple frontend URLs in production if needed
origins = [url.strip() for url in FRONTEND_URL.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONNECTION_PARAMS = {
    "sample_rate": 16000,
    "speech_model": "u3-rt-pro"
}
API_ENDPOINT_BASE_URL = "wss://streaming.assemblyai.com/v3/ws"
API_ENDPOINT = f"{API_ENDPOINT_BASE_URL}?{urlencode(CONNECTION_PARAMS)}"

from graph import run_agent

async def get_ai_response(user_text):
    print("🧠 Thinking (LangGraph)...")
    return await run_agent(user_text)

@app.websocket("/api/voice")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Frontend connected")
    
    is_bot_speaking = False
    interrupt_event = asyncio.Event()

    try:
        print(f"🔗 Connecting to AssemblyAI: {API_ENDPOINT}")
        aai_ws = await ws_connect(
            API_ENDPOINT,
            additional_headers={"Authorization": API_KEY}
        )
        print("✅ Connected to AssemblyAI STT")

        # Task 1: Receive raw PCM from Frontend, send to AssemblyAI
        async def receive_from_frontend():
            try:
                while True:
                    data = await websocket.receive_bytes()
                    # Only forward audio when bot is NOT speaking (prevents feedback loop)
                    if not is_bot_speaking:
                        await aai_ws.send(data)
            except WebSocketDisconnect:
                print("Frontend disconnected.")
            except Exception as e:
                print(f"Frontend receive error: {e}")

        # Task 2: Receive JSON Turn messages from AssemblyAI, process, send TTS to Frontend
        async def receive_from_aai():
            nonlocal is_bot_speaking
            try:
                async for message in aai_ws:
                    data = json.loads(message)
                    
                    if "error" in data:
                        print(f"❌ AssemblyAI Error: {data}")

                    msg_type = data.get('type')

                    if msg_type == "Begin":
                        print(f"📡 Session started: {data.get('id')}")

                    elif msg_type == "Turn":
                        transcript = data.get('transcript', '')
                        formatted = data.get('turn_is_formatted', False)

                        # Barge-in detection
                        if transcript.strip() and is_bot_speaking:
                            if len(transcript.strip()) > 3:
                                interrupt_event.set()
                                try:
                                    await websocket.send_json({"type": "interrupted"})
                                except:
                                    pass

                        if not is_bot_speaking:
                            if formatted:
                                if transcript.strip():
                                    print(f"🧾 You: {transcript}")
                                    await websocket.send_json({"type": "transcript", "text": transcript, "is_final": True})
                                    asyncio.create_task(handle_turn(transcript))
                            else:
                                # Send partial transcript to frontend for real-time display
                                if transcript.strip():
                                    print(f"\r{transcript}", end='', flush=True)
                                    await websocket.send_json({"type": "transcript", "text": transcript, "is_final": False})

                    elif msg_type == "Termination":
                        print(f"📴 AssemblyAI session terminated: {data}")

            except ConnectionClosed as e:
                print(f"AssemblyAI disconnected: {e}")
            except Exception as e:
                print(f"AAI receive error: {e}\n{traceback.format_exc()}")

        async def handle_turn(transcript):
            nonlocal is_bot_speaking
            is_bot_speaking = True
            interrupt_event.clear()
            try:
                await websocket.send_json({"type": "bot_thinking", "status": "start"})
                
                ai_response = await get_ai_response(transcript)
                clean_text = ai_response.replace('\n', ' ')
                print(f"🤖: {clean_text}")

                # Send AI text to frontend for chat display
                await websocket.send_json({"type": "bot_text", "text": clean_text})

                await websocket.send_json({"type": "bot_speaking", "status": "start"})

                async with client.audio.speech.with_streaming_response.create(
                    model="tts-1",
                    voice="alloy",
                    response_format="pcm",
                    input=clean_text
                ) as response:
                    async for chunk in response.iter_bytes(chunk_size=4096):
                        if interrupt_event.is_set():
                            print("\n🛑 Interrupted!")
                            break
                        if chunk:
                            await websocket.send_bytes(chunk)
                            
                await websocket.send_json({"type": "bot_speaking", "status": "stop"})
                    
            except Exception as e:
                print(f"❌ Agent Error: {e}\n{traceback.format_exc()}")
                try:
                    await websocket.send_json({"type": "bot_speaking", "status": "stop"})
                except:
                    pass
            finally:
                is_bot_speaking = False
                print("🎙️ Listening...")

        # Run both tasks concurrently
        task1 = asyncio.create_task(receive_from_frontend())
        task2 = asyncio.create_task(receive_from_aai())

        done, pending = await asyncio.wait(
            [task1, task2],
            return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()

        await aai_ws.close()

    except Exception as e:
        print(f"❌ WebSocket endpoint error: {e}\n{traceback.format_exc()}")
    finally:
        try:
            await websocket.close()
        except:
            pass


# ═══════════════════════════════════════════════════════════════
# Interview WebSocket Endpoint
# ═══════════════════════════════════════════════════════════════

from graph import run_interview

@app.websocket("/api/interview")
async def interview_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🎤 Interview session connected")

    is_bot_speaking = False
    is_processing = False  # Prevents overlapping turns
    turn_lock = asyncio.Lock()  # Only one turn at a time
    interrupt_event = asyncio.Event()
    interview_state = None  # Will be initialized when we receive start_interview

    try:
        aai_ws = await ws_connect(
            API_ENDPOINT,
            additional_headers={"Authorization": API_KEY}
        )
        print("✅ Connected to AssemblyAI STT (Interview)")

        async def speak_text(text: str):
            """Stream TTS audio to the frontend."""
            nonlocal is_bot_speaking
            is_bot_speaking = True
            interrupt_event.clear()
            try:
                await websocket.send_json({"type": "bot_speaking", "status": "start"})
                async with client.audio.speech.with_streaming_response.create(
                    model="tts-1",
                    voice="alloy",
                    response_format="pcm",
                    input=text
                ) as response:
                    async for chunk in response.iter_bytes(chunk_size=4096):
                        if interrupt_event.is_set():
                            print("\n🛑 Interrupted!")
                            break
                        if chunk:
                            await websocket.send_bytes(chunk)
                await websocket.send_json({"type": "bot_speaking", "status": "stop"})
            except Exception as e:
                print(f"❌ TTS Error: {e}")
                try:
                    await websocket.send_json({"type": "bot_speaking", "status": "stop"})
                except:
                    pass
            finally:
                is_bot_speaking = False

        async def handle_interview_turn(user_text: str):
            """Process a user answer through the interview graph."""
            nonlocal interview_state, is_processing
            if not interview_state or is_processing:
                return

            async with turn_lock:
                is_processing = True
                try:
                    await _process_turn(user_text)
                finally:
                    is_processing = False

        async def _process_turn(user_text: str):
            """Inner turn processor — always runs under turn_lock."""
            nonlocal interview_state
            if not interview_state:
                return

            await websocket.send_json({"type": "bot_thinking", "status": "start"})

            # Update state with user's answer
            interview_state["user_input"] = user_text
            interview_state["phase"] = "answering"

            # Run the graph
            interview_state = await run_interview(interview_state)

            response_text = interview_state.get("response", "")
            clean_text = response_text.replace('\n', ' ')
            print(f"🤖 Interviewer: {clean_text[:80]}...")

            # Send metadata to frontend
            await websocket.send_json({
                "type": "interview_update",
                "question_index": interview_state["current_q_index"],
                "is_complete": interview_state.get("is_complete", False),
                "last_score": interview_state["answers"][-1]["score"] if interview_state.get("answers") else None,
                "last_feedback": interview_state["answers"][-1]["feedback"] if interview_state.get("answers") else None,
            })

            await websocket.send_json({"type": "bot_text", "text": clean_text})

            # If interview is complete, send final results
            if interview_state.get("is_complete", False):
                await websocket.send_json({
                    "type": "interview_complete",
                    "final_score": interview_state.get("final_score", 0),
                    "final_feedback": interview_state.get("final_feedback", ""),
                    "answers": interview_state.get("answers", []),
                })

            # Speak the response
            await speak_text(clean_text)

        # Task 1: Receive from frontend (audio bytes + JSON commands)
        async def receive_from_frontend():
            nonlocal interview_state
            try:
                while True:
                    message = await websocket.receive()
                    
                    if "bytes" in message:
                        # Only forward audio when bot is NOT speaking/processing
                        # This prevents the mic from picking up TTS and creating a feedback loop
                        if not is_bot_speaking and not is_processing:
                            await aai_ws.send(message["bytes"])
                    elif "text" in message:
                        # JSON command
                        data = json.loads(message["text"])
                        
                        if data.get("type") == "start_interview":
                            interview_type = data.get("interview_type", "fullstack")
                            print(f"🚀 Starting {interview_type} interview")
                            
                            # Initialize interview state
                            interview_state = {
                                "interview_type": interview_type,
                                "phase": "init",
                                "questions": [],
                                "current_q_index": 0,
                                "answers": [],
                                "user_input": "",
                                "response": "",
                                "is_complete": False,
                                "final_score": 0,
                                "final_feedback": "",
                            }
                            
                            await websocket.send_json({"type": "bot_thinking", "status": "start"})
                            
                            # Run init phase
                            interview_state = await run_interview(interview_state)
                            
                            response_text = interview_state.get("response", "")
                            clean_text = response_text.replace('\n', ' ')
                            print(f"🤖 Interviewer: {clean_text[:80]}...")
                            
                            await websocket.send_json({
                                "type": "interview_started",
                                "interview_type": interview_type,
                                "total_questions": len(interview_state.get("questions", [])),
                            })
                            await websocket.send_json({"type": "bot_text", "text": clean_text})
                            
                            # Speak the welcome + first question
                            await speak_text(clean_text)
                            
            except WebSocketDisconnect:
                print("Interview frontend disconnected.")
            except Exception as e:
                print(f"Interview frontend error: {e}\n{traceback.format_exc()}")

        # Task 2: Receive transcripts from AssemblyAI
        async def receive_from_aai():
            nonlocal is_bot_speaking
            try:
                async for message in aai_ws:
                    data = json.loads(message)
                    
                    if "error" in data:
                        print(f"❌ AssemblyAI Error: {data}")

                    msg_type = data.get('type')

                    if msg_type == "Begin":
                        print(f"📡 Interview STT session started: {data.get('id')}")

                    elif msg_type == "Turn":
                        transcript = data.get('transcript', '')
                        formatted = data.get('turn_is_formatted', False)

                        # Barge-in
                        if transcript.strip() and is_bot_speaking:
                            if len(transcript.strip()) > 3:
                                interrupt_event.set()
                                try:
                                    await websocket.send_json({"type": "interrupted"})
                                except:
                                    pass

                        if not is_bot_speaking and not is_processing and interview_state:
                            if formatted:
                                if transcript.strip():
                                    print(f"🧾 Candidate: {transcript}")
                                    await websocket.send_json({"type": "transcript", "text": transcript, "is_final": True})
                                    asyncio.create_task(handle_interview_turn(transcript))
                            else:
                                if transcript.strip():
                                    await websocket.send_json({"type": "transcript", "text": transcript, "is_final": False})

                    elif msg_type == "Termination":
                        print(f"📴 Interview STT terminated: {data}")

            except ConnectionClosed as e:
                print(f"Interview AAI disconnected: {e}")
            except Exception as e:
                print(f"Interview AAI error: {e}\n{traceback.format_exc()}")

        # Run both concurrently
        task1 = asyncio.create_task(receive_from_frontend())
        task2 = asyncio.create_task(receive_from_aai())

        done, pending = await asyncio.wait(
            [task1, task2],
            return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()

        await aai_ws.close()

    except Exception as e:
        print(f"❌ Interview endpoint error: {e}\n{traceback.format_exc()}")
    finally:
        try:
            await websocket.close()
        except:
            pass