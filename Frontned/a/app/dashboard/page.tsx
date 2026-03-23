"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

const FEATURES = [
  {
    icon: "🎙️",
    title: "Real-Time Voice AI",
    desc: "Speak naturally. Our AI interviewer listens, understands, and responds in real-time — just like a real interview.",
    color: "#3b82f6",
  },
  {
    icon: "🧠",
    title: "Adaptive Questions",
    desc: "Powered by LangGraph, each interview generates role-specific questions that adapt to your experience level.",
    color: "#8b5cf6",
  },
  {
    icon: "📊",
    title: "Instant Scoring",
    desc: "Every answer is evaluated on a 10-point scale with detailed feedback. See your strengths and blind spots instantly.",
    color: "#10b981",
  },
  {
    icon: "🏆",
    title: "Summary Report",
    desc: "Conclude your session with a comprehensive AI-generated spoken summary report and final evaluation score out of 100.",
    color: "#f59e0b",
  },
];



const STEPS = [
  { num: "01", title: "Pick Your Role", desc: "Choose from Full Stack Developer or ML Engineer interviews.", icon: "🎯" },
  { num: "02", title: "Start Speaking", desc: "The AI interviewer asks questions and you respond naturally with your voice.", icon: "🎤" },
  { num: "03", title: "Final Summary", desc: "Each answer is evaluated in real-time. At the end, receive a personalized AI summary report.", icon: "✅" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  if (status === "loading") {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "#3b82f6", borderRadius: "50%" }}
          />
          <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* ─── Navbar ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 40px", borderBottom: "1px solid var(--bg-secondary)",
          position: "sticky", top: 0, zIndex: 50, background: "var(--bg-nav)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>⚡</span>
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.03em" }}>Vocalyst</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <ThemeToggle />
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{session?.user?.name}</span>
          <button
            onClick={() => signOut()}
            style={{
              padding: "7px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
              borderRadius: "8px", color: "var(--text-secondary)", fontSize: "12px", cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            Sign Out
          </button>
        </div>
      </motion.nav>

      {/* ─── Hero ─── */}
      <section style={{ padding: "80px 40px 60px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "60px" }}>
          <div style={{ flex: 1 }}>
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <span style={{
                display: "inline-block", padding: "6px 14px", background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)", borderRadius: "20px", fontSize: "11px",
                color: "var(--text-secondary)", fontWeight: 500, marginBottom: "20px", letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
                AI-Powered Mock Interviews
              </span>
            </motion.div>
            <motion.h1
              custom={1} variants={fadeUp} initial="hidden" animate="visible"
              style={{ fontSize: "46px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 20px 0" }}
            >
              Ace Your Next
              <br />
              <span style={{ color: "#3b82f6" }}>Tech Interview</span>
            </motion.h1>
            <motion.p
              custom={2} variants={fadeUp} initial="hidden" animate="visible"
              style={{ fontSize: "16px", color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 32px 0", maxWidth: "420px" }}
            >
              Practice with an AI interviewer that speaks, listens, and scores
              your answers in real-time. Get role-specific questions and instant
              feedback to level up your interview skills.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => router.push("/interviews")}
                style={{
                  padding: "14px 28px", background: "#3b82f6", color: "white", border: "none",
                  borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#2563eb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#3b82f6"; }}
              >
                Start Practicing
              </button>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                style={{
                  padding: "14px 28px", background: "transparent", color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)", borderRadius: "10px", fontSize: "14px",
                  fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                How It Works
              </button>
            </motion.div>
          </div>
          <motion.div
            custom={2} variants={scaleIn} initial="hidden" animate="visible"
            style={{ flex: 1, display: "flex", justifyContent: "center" }}
          >
            <Image
              src="/images/hero.png"
              alt="AI Interview"
              width={440}
              height={440}
              style={{ borderRadius: "20px", objectFit: "cover" }}
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ padding: "60px 40px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <motion.h2
          custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "28px", fontWeight: 700, textAlign: "center", margin: "0 0 12px 0", letterSpacing: "-0.03em" }}
        >
          Why Vocalyst?
        </motion.h2>
        <motion.p
          custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "14px", color: "var(--text-dim)", textAlign: "center", margin: "0 0 48px 0" }}
        >
          Everything you need to prepare for your dream job
        </motion.p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{
                background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "16px",
                padding: "28px 22px", cursor: "default", transition: "border-color 0.3s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = f.color; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; }}
            >
              <div style={{ fontSize: "28px", marginBottom: "14px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 8px 0" }}>{f.title}</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", height: "1px", background: "var(--bg-secondary)" }} />

      {/* ─── How It Works ─── */}
      <section id="how-it-works" style={{ padding: "80px 40px", maxWidth: "900px", margin: "0 auto" }}>
        <motion.h2
          custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "28px", fontWeight: 700, textAlign: "center", margin: "0 0 12px 0", letterSpacing: "-0.03em" }}
        >
          How It Works
        </motion.h2>
        <motion.p
          custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "14px", color: "var(--text-dim)", textAlign: "center", margin: "0 0 56px 0" }}
        >
          Three simple steps to interview mastery
        </motion.p>

        <div style={{ display: "flex", gap: "24px" }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              custom={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{
                flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                borderRadius: "16px", padding: "28px 22px", textAlign: "center",
              }}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px", background: "var(--border-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px auto", fontSize: "22px",
              }}>
                {step.icon}
              </div>
              <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 700, letterSpacing: "0.1em" }}>
                STEP {step.num}
              </span>
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "8px 0", letterSpacing: "-0.02em" }}>{step.title}</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section style={{ padding: "60px 40px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "64px" }}>
          {[
            { num: "10", label: "Questions Per Interview" },
            { num: "2", label: "Interview Tracks" },
            { num: "100", label: "Max Score" },
            { num: "<3s", label: "Response Time" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{ textAlign: "center" }}
            >
              <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{stat.num}</div>
              <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px", fontWeight: 500 }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", height: "1px", background: "var(--bg-secondary)" }} />

      {/* ─── CTA ─── */}
      <section style={{ padding: "80px 40px", textAlign: "center" }}>
        <motion.h2
          custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "32px", fontWeight: 700, margin: "0 0 12px 0", letterSpacing: "-0.03em" }}
        >
          Ready to Practice?
        </motion.h2>
        <motion.p
          custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "14px", color: "var(--text-dim)", margin: "0 0 28px 0" }}
        >
          Start your first mock interview now. No preparation needed.
        </motion.p>
        <motion.button
          custom={2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/interviews")}
          style={{
            padding: "16px 36px", background: "#3b82f6", color: "white", border: "none",
            borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: "pointer",
          }}
        >
          Get Started — It&apos;s Free
        </motion.button>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        borderTop: "1px solid var(--bg-secondary)", padding: "40px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        maxWidth: "1100px", margin: "0 auto",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "16px" }}>⚡</span>
            <span style={{ fontSize: "14px", fontWeight: 700 }}>Vocalyst</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--border-hover)", margin: 0, maxWidth: "280px", lineHeight: 1.6 }}>
            AI-powered mock interview platform. Practice technical interviews with
            real-time voice AI and get instant scoring and feedback.
          </p>
        </div>
        <div style={{ display: "flex", gap: "64px" }}>
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-dim)", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Interviews
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "8px" }}>
                <span onClick={() => router.push("/interviews")} style={{ fontSize: "13px", color: "var(--text-muted)", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                >Browse All Interviews</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-dim)", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Technology
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "8px" }}><span style={{ fontSize: "13px", color: "var(--text-muted)" }}>LangGraph</span></li>
              <li style={{ marginBottom: "8px" }}><span style={{ fontSize: "13px", color: "var(--text-muted)" }}>OpenAI TTS</span></li>
              <li><span style={{ fontSize: "13px", color: "var(--text-muted)" }}>AssemblyAI STT</span></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* ─── Copyright ─── */}
      <div style={{ textAlign: "center", padding: "20px 40px 32px", borderTop: "1px solid var(--bg-secondary)" }}>
        <p style={{ fontSize: "11px", color: "var(--border-subtle)", margin: 0 }}>
          © 2026 Vocalyst. Built with Next.js, LangGraph, and OpenAI.
        </p>
      </div>
    </main>
  );
}
