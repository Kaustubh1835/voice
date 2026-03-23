let recordingContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let processor: ScriptProcessorNode | null = null;

let nextStartTime = 0;
let playbackContext: AudioContext | null = null;

// Convert Float32 audio to 16-bit PCM ArrayBuffer
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
}

export async function startRecording(onAudioData: (data: ArrayBuffer) => void) {
    if (typeof window === 'undefined') return;

    mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        } 
    });

    // Request exactly 16000 sample rate for AssemblyAI
    recordingContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const source = recordingContext.createMediaStreamSource(mediaStream);

    processor = recordingContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = floatTo16BitPCM(inputData);
        onAudioData(pcmData);
    };

    source.connect(processor);
    processor.connect(recordingContext.destination);
}

export function stopRecording() {
    if (processor && recordingContext) {
        processor.disconnect();
        recordingContext.close();
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    recordingContext = null;
    processor = null;
    mediaStream = null;
}

export function pushPlaybackChunk(chunk: ArrayBuffer) {
    if (!playbackContext) {
        // Run output at default system rate
        playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (playbackContext.state === 'suspended') {
        playbackContext.resume();
    }

    const int16Array = new Int16Array(chunk);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
    }

    // OpenAI TTS returns 24000Hz PCM
    const audioBuffer = playbackContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playbackContext.destination);

    if (nextStartTime < playbackContext.currentTime) {
        nextStartTime = playbackContext.currentTime + 0.05; // slight buffer to avoid stutter
    }
    source.start(nextStartTime);
    nextStartTime += audioBuffer.duration;
}

export function interruptPlayback() {
    if (playbackContext) {
        playbackContext.close();
        playbackContext = null;
        nextStartTime = 0;
    }
}
