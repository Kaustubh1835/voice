"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  startRecording,
  stopRecording,
  pushPlaybackChunk,
  interruptPlayback,
} from "../lib/audioUtils";

type AppState = "idle" | "listening" | "thinking" | "speaking";

interface TranscriptEntry {
  role: "user" | "ai";
  text: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [conversation, setConversation] = useState<TranscriptEntry[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, liveTranscript]);

  // Auth guard — redirect to dashboard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Session timer
  useEffect(() => {
    if (appState !== "idle") {
      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appState === "idle"]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const connectWebSocket = useCallback(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
    const wsUrl = backendUrl.replace(/^http/, "ws") + "/api/voice";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to Voice Agent");
      setAppState("listening");
      startRecording((pcmData) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(pcmData);
        }
      });
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "transcript") {
            if (msg.is_final) {
              setLiveTranscript("");
              setConversation((prev) => [
                ...prev,
                { role: "user", text: msg.text },
              ]);
            } else {
              setLiveTranscript(msg.text);
            }
          } else if (msg.type === "bot_thinking") {
            setAppState("thinking");
          } else if (msg.type === "bot_speaking") {
            if (msg.status === "start") {
              setAppState("speaking");
            } else if (msg.status === "stop") {
              setAppState("listening");
            }
          } else if (msg.type === "bot_text") {
            setConversation((prev) => [
              ...prev,
              { role: "ai", text: msg.text },
            ]);
          } else if (msg.type === "interrupted") {
            interruptPlayback();
            setAppState("listening");
          }
        } catch (e) {
          console.error(e);
        }
      } else if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        pushPlaybackChunk(arrayBuffer);
      }
    };

    ws.onerror = () => console.error("Connection error");

    ws.onclose = () => {
      setAppState("idle");
      stopRecording();
      interruptPlayback();
    };

    wsRef.current = ws;
  }, []);

  const startSession = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setConversation([]);
      setLiveTranscript("");
      connectWebSocket();
    } catch {
      alert("Microphone access is required to use Voice Agent.");
    }
  };

  const endSession = () => {
    if (wsRef.current) wsRef.current.close();
    setAppState("idle");
    stopRecording();
    interruptPlayback();
  };

  const getStatusText = () => {
    switch (appState) {
      case "idle":
        return "Ready";
      case "listening":
        return "Listening";
      case "thinking":
        return "Processing";
      case "speaking":
        return "Responding";
      default:
        return "";
    }
  };

  const getOrbClass = () => {
    switch (appState) {
      case "idle":
        return "orb-idle";
      case "listening":
        return "orb-listening";
      case "thinking":
        return "orb-thinking";
      case "speaking":
        return "orb-speaking";
      default:
        return "";
    }
  };

  const isActive = appState !== "idle";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Voice Agent
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                margin: "4px 0 0 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {session?.user?.name || "Guest"}
              <span
                onClick={() => signOut()}
                style={{
                  color: "var(--accent-red)",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                Sign out
              </span>
            </p>
          </div>
          {isActive && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                background: "var(--bg-secondary)",
                borderRadius: "20px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className={`status-dot status-dot-${appState}`} />
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {getStatusText()}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatTime(sessionDuration)}
              </span>
            </div>
          )}
        </div>

        {/* Main Card */}
        <div
          style={{
            width: "100%",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          {/* Conversation Feed */}
          {isActive && (
            <div
              className="custom-scrollbar"
              style={{
                height: "280px",
                overflowY: "auto",
                padding: "20px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {conversation.length === 0 && !liveTranscript && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Start speaking...
                  </span>
                </div>
              )}

              {conversation.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent:
                      entry.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: "12px",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  <div
                    className={
                      entry.role === "user" ? "chat-user" : "chat-ai"
                    }
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    {entry.text}
                  </div>
                </div>
              ))}

              {/* Live partial transcript */}
              {liveTranscript && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    className="chat-partial"
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    {liveTranscript}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Orb Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: isActive ? "32px 20px" : "48px 20px",
            }}
          >
            <div className="orb-container" style={{ width: 144, height: 144, marginBottom: 24 }}>
              <div
                className={`orb-ring ${
                  appState === "listening"
                    ? "orb-ring-listening"
                    : appState === "speaking"
                    ? "orb-ring-speaking"
                    : appState === "thinking"
                    ? "orb-ring-thinking"
                    : ""
                }`}
              />
              <div
                className={`orb-ring-outer ${
                  isActive ? "orb-ring-outer-active" : ""
                }`}
              />
              <div className={`orb ${getOrbClass()}`}>
                {appState === "idle" && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                )}

                {appState === "speaking" && (
                  <div
                    className="waveform"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <div className="waveform-bar" />
                    <div className="waveform-bar" />
                    <div className="waveform-bar" />
                    <div className="waveform-bar" />
                    <div className="waveform-bar" />
                  </div>
                )}
              </div>
            </div>

            {/* Status text under orb */}
            {!isActive && (
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  margin: "0 0 8px 0",
                  fontWeight: 400,
                }}
              >
                Tap to begin your conversation
              </p>
            )}
          </div>

          {/* Action Area */}
          <div style={{ padding: "0 20px 20px 20px" }}>
            {appState === "idle" ? (
              <button className="btn-primary" onClick={startSession}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                Start Conversation
              </button>
            ) : (
              <button className="btn-end" onClick={endSession}>
                End Conversation
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "16px",
            textAlign: "center",
          }}
        >
          Use headphones for best experience
        </p>
      </div>
    </main>
  );
}
