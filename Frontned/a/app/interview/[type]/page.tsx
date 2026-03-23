"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  startRecording,
  stopRecording,
  pushPlaybackChunk,
  interruptPlayback,
} from "@/lib/audioUtils";

type SessionState = "connecting" | "listening" | "thinking" | "speaking" | "complete";

interface AnswerResult {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

const INTERVIEW_META: Record<string, { title: string; icon: string; color: string }> = {
  fullstack: { title: "Full Stack Developer", icon: "🖥️", color: "#3b82f6" },
  ml: { title: "ML Engineer", icon: "🧠", color: "#8b5cf6" },
  devops: { title: "DevOps Engineer", icon: "☁️", color: "#f59e0b" },
};

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const interviewType = params.type as string;

  const [sessionState, setSessionState] = useState<SessionState>("connecting");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [finalFeedback, setFinalFeedback] = useState("");
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const meta = INTERVIEW_META[interviewType] || { title: "Interview", icon: "📋", color: "#3b82f6" };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  useEffect(() => {
    if (sessionState !== "connecting" && sessionState !== "complete") {
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionState]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const startInterview = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Microphone access is required.");
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
    const wsUrl = backendUrl.replace(/^http/, "ws") + "/api/interview";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      startRecording((pcmData) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(pcmData);
      });
      ws.send(JSON.stringify({ type: "start_interview", interview_type: interviewType }));
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "transcript") {
            msg.is_final ? setLiveTranscript("") : setLiveTranscript(msg.text);
          } else if (msg.type === "bot_thinking") {
            setSessionState("thinking");
          } else if (msg.type === "bot_speaking") {
            msg.status === "start" ? setSessionState("speaking") : setSessionState("listening");
          } else if (msg.type === "bot_text") {
            setCurrentText(msg.text);
          } else if (msg.type === "interview_started") {
            setTotalQuestions(msg.total_questions || 10);
            setQuestionIndex(0);
          } else if (msg.type === "interview_update") {
            setQuestionIndex(msg.question_index);
          } else if (msg.type === "interview_complete") {
            setSessionState("complete");
            setFinalScore(msg.final_score);
            setFinalFeedback(msg.final_feedback);
            setAnswers(msg.answers || []);
          } else if (msg.type === "interrupted") {
            interruptPlayback();
            setSessionState("listening");
          }
        } catch (e) { console.error(e); }
      } else if (event.data instanceof Blob) {
        pushPlaybackChunk(await event.data.arrayBuffer());
      }
    };

    ws.onerror = () => console.error("Interview WS error");
    ws.onclose = () => { stopRecording(); interruptPlayback(); };
    wsRef.current = ws;
  }, [interviewType]);

  useEffect(() => {
    if (status === "authenticated") startInterview();
    return () => {
      if (wsRef.current) wsRef.current.close();
      stopRecording(); interruptPlayback();
    };
  }, [status]);

  const endInterview = () => { if (wsRef.current) wsRef.current.close(); router.push("/dashboard"); };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const statusColor = sessionState === "speaking" ? "#10b981" : sessionState === "thinking" ? "#8b5cf6" : sessionState === "listening" ? "#3b82f6" : "var(--border-hover)";
  const statusText = sessionState === "speaking" ? "Speaking" : sessionState === "thinking" ? "Processing" : sessionState === "connecting" ? "Connecting" : "Listening";

  // ─── Completion Screen ───
  if (sessionState === "complete") {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
          style={{ maxWidth: "560px", width: "100%", textAlign: "center" }}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</motion.div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0", letterSpacing: "-0.03em" }}>Interview Complete</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "32px" }}>{meta.title} · {formatTime(elapsed)}</p>

          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
            style={{
              width: "130px", height: "130px", borderRadius: "50%",
              border: `3px solid ${getScoreColor(finalScore)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px auto", background: "var(--bg-secondary)",
            }}
          >
            <div>
              <div style={{ fontSize: "36px", fontWeight: 800, color: getScoreColor(finalScore), letterSpacing: "-0.03em" }}>{finalScore}</div>
              <div style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 500 }}>out of 100</div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "32px", maxWidth: "440px", margin: "0 auto 32px auto" }}
          >
            {finalFeedback}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            style={{ textAlign: "left", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px 0", letterSpacing: "-0.01em" }}>Question Breakdown</h3>
            {answers.map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ flex: 1, marginRight: "16px" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 3px 0", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--text-dim)", fontWeight: 600 }}>Q{i + 1}.</span> {a.question.length > 90 ? a.question.slice(0, 90) + "..." : a.question}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>{a.feedback}</p>
                </div>
                <div style={{
                  fontSize: "13px", fontWeight: 700, color: getScoreColor(a.score * 10),
                  flexShrink: 0, background: "var(--border-subtle)", padding: "3px 10px", borderRadius: "6px",
                }}>
                  {a.score}/10
                </div>
              </div>
            ))}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "14px 32px", background: "#3b82f6", color: "white", border: "none",
              borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </main>
    );
  }

  // ─── Interview Session ───
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column", color: "var(--text-primary)" }}>
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 32px", borderBottom: "1px solid var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "18px" }}>{meta.icon}</span>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>{meta.title}</span>
          <span style={{
            padding: "3px 10px", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
            borderRadius: "6px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 500,
          }}>
            Q{Math.min(questionIndex + 1, totalQuestions)}/{totalQuestions}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Status dot */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%", background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
            }} />
            <span style={{ fontSize: "11px", color: statusColor, fontWeight: 500 }}>{statusText}</span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--border-hover)", fontVariantNumeric: "tabular-nums" }}>
            {formatTime(elapsed)}
          </span>
          <ThemeToggle />
          <span style={{ fontSize: "13px", color: "var(--text-muted)", marginLeft: "12px" }}>
            {session?.user?.name}
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={endInterview}
            style={{
              padding: "7px 18px", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
              borderRadius: "8px", color: "#ef4444", fontSize: "12px", fontWeight: 500, cursor: "pointer",
            }}
          >
            End
          </motion.button>
        </div>
      </motion.div>

      {/* Progress */}
      <div style={{ height: "2px", background: "var(--bg-secondary)" }}>
        <motion.div
          animate={{ width: `${(Math.min(questionIndex + 1, totalQuestions) / totalQuestions) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", background: meta.color }}
        />
      </div>

      {/* Split View */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px", gap: "28px" }}>
        {/* AI */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            width: "340px", height: "380px", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
            borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", position: "relative",
          }}
        >
          <motion.div
            animate={{
              borderColor: statusColor,
              boxShadow: sessionState === "speaking" ? `0 0 20px ${statusColor}40` : "none",
            }}
            transition={{ duration: 0.3 }}
            style={{
              width: "88px", height: "88px", borderRadius: "50%", background: "var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
              border: "2px solid var(--border-hover)",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={sessionState === "speaking" ? "#10b981" : "var(--text-muted)"} strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </motion.div>
          <span style={{ fontSize: "15px", fontWeight: 600 }}>AI Interviewer</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={sessionState}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              style={{ fontSize: "11px", fontWeight: 500, marginTop: "4px", color: statusColor }}
            >
              {statusText}
            </motion.span>
          </AnimatePresence>

          <AnimatePresence>
            {sessionState === "speaking" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="waveform" style={{ marginTop: "20px", color: "#10b981" }}
              >
                <div className="waveform-bar" /><div className="waveform-bar" /><div className="waveform-bar" />
                <div className="waveform-bar" /><div className="waveform-bar" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Candidate */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            width: "340px", height: "380px", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
            borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            animate={{
              borderColor: sessionState === "listening" ? "#3b82f6" : "var(--border-hover)",
              boxShadow: sessionState === "listening" ? "0 0 20px rgba(59,130,246,0.25)" : "none",
            }}
            transition={{ duration: 0.3 }}
            style={{
              width: "88px", height: "88px", borderRadius: "50%", background: "var(--border-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
              border: "2px solid var(--border-hover)",
            }}
          >
            <span style={{ fontSize: "30px", fontWeight: 700, color: "var(--text-primary)" }}>
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </motion.div>
          <span style={{ fontSize: "15px", fontWeight: 600 }}>{session?.user?.name || "You"}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={sessionState === "listening" ? "speak" : "wait"}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              style={{ fontSize: "11px", color: sessionState === "listening" ? "#3b82f6" : "var(--text-dim)", marginTop: "4px", fontWeight: 500 }}
            >
              {sessionState === "listening" ? "Your turn to speak" : "Waiting..."}
            </motion.span>
          </AnimatePresence>

          <AnimatePresence>
            {sessionState === "listening" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="waveform" style={{ marginTop: "20px", color: "#3b82f6" }}
              >
                <div className="waveform-bar" /><div className="waveform-bar" /><div className="waveform-bar" />
                <div className="waveform-bar" /><div className="waveform-bar" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Transcript Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ padding: "16px 32px 24px", display: "flex", justifyContent: "center" }}
      >
        <div style={{
          maxWidth: "640px", width: "100%", minHeight: "44px",
          background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "12px",
          padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={liveTranscript || currentText || "empty"}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                fontSize: "13px", margin: 0, textAlign: "center", lineHeight: 1.5,
                color: currentText ? "var(--text-secondary)" : liveTranscript ? "#3b82f6" : "var(--border-hover)",
                fontStyle: liveTranscript && !currentText ? "italic" : "normal",
              }}
            >
              {liveTranscript || currentText || "Waiting for speech..."}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  );
}
