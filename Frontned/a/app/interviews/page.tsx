"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const BENEFITS = [
  { icon: "🎯", title: "Role-Specific", desc: "Questions tailored to your exact job role and tech stack" },
  { icon: "🔊", title: "Voice-First", desc: "Speak naturally — just like a real phone or video interview" },
  { icon: "🧠", title: "AI-Powered", desc: "Powered by LangGraph and GPT-4 for intelligent conversations" },
  { icon: "⚡", title: "Instant Scoring", desc: "Get an immediate score out of 10 for every answer you provide" },
  { icon: "🏆", title: "Final Evaluation", desc: "Receive an overall score and an AI spoken summary after 10 questions" },
  { icon: "🔄", title: "Fresh Every Time", desc: "No repeated questions — each session is uniquely generated" },
];

const INTERVIEWS = [
  {
    id: "fullstack",
    title: "Full Stack Developer",
    subtitle: "Web & Backend Technologies",
    desc: "Covers React, Next.js, Node.js, REST APIs, databases, system design, authentication patterns, and deployment strategies. Perfect for frontend and backend roles.",
    icon: "🖥️",
    tags: ["React", "Node.js", "SQL", "System Design", "APIs", "TypeScript"],
    color: "#3b82f6",
    questions: 10,
    duration: "~15 min",
    difficulty: "Mid-Senior",
  },
  {
    id: "ml",
    title: "ML Engineer",
    subtitle: "Machine Learning & AI",
    desc: "Practice neural networks, transformers, NLP pipelines, model evaluation metrics, MLOps best practices, and ML system design at scale. Ideal for ML and AI roles.",
    icon: "🧠",
    tags: ["PyTorch", "NLP", "Deep Learning", "MLOps", "Transformers", "Python"],
    color: "#8b5cf6",
    questions: 10,
    duration: "~15 min",
    difficulty: "Mid-Senior",
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    subtitle: "Cloud & Infrastructure",
    desc: "Practice designing CI/CD pipelines, containerization with Docker and Kubernetes, Infrastructure as Code, and cloud native architectures. Ideal for Cloud and DevOps roles.",
    icon: "☁️",
    tags: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux"],
    color: "#f59e0b",
    questions: 10,
    duration: "~15 min",
    difficulty: "Mid-Senior",
  },
];

const TESTIMONIALS = [
  { text: "The AI interviewer felt surprisingly real. It caught gaps in my system design answers I didn't even notice.", name: "Frontend Developer", rating: 5 },
  { text: "Practiced 3 times before my Google interview. The instant scoring helped me focus on weak areas fast.", name: "ML Researcher", rating: 5 },
  { text: "Much better than practicing alone. The voice interaction makes it feel like actual interview pressure.", name: "Full Stack Engineer", rating: 5 },
];

export default function InterviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  if (status === "loading") {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: "24px", height: "24px", border: "2px solid var(--border-subtle)", borderTopColor: "#3b82f6", borderRadius: "50%" }}
        />
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* ─── Nav ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 40px", borderBottom: "1px solid var(--bg-secondary)",
          position: "sticky", top: 0, zIndex: 50, background: "var(--bg-nav)", backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none",
            color: "var(--text-muted)", fontSize: "13px", cursor: "pointer", padding: 0, transition: "color 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          ← Back to Home
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>⚡</span>
            <span style={{ fontSize: "14px", fontWeight: 700 }}>Vocalyst</span>
          </div>
          <ThemeToggle />
          <span style={{ fontSize: "13px", color: "var(--text-muted)", marginLeft: "10px" }}>{session?.user?.name}</span>
        </div>
      </motion.div>

      {/* ─── Hero Section ─── */}
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
                Practice Makes Perfect
              </span>
            </motion.div>
            <motion.h1
              custom={1} variants={fadeUp} initial="hidden" animate="visible"
              style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 16px 0" }}
            >
              Interview Practice
              <br />
              <span style={{ color: "#3b82f6" }}>That Actually Works</span>
            </motion.h1>
            <motion.p
              custom={2} variants={fadeUp} initial="hidden" animate="visible"
              style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 28px 0", maxWidth: "420px" }}
            >
              Our AI interviewer simulates real technical interviews with voice interaction,
              adaptive questioning, and instant scoring. Choose a role below and start practicing
              in under 60 seconds.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" style={{ display: "flex", gap: "24px" }}>
              {[
                { num: "10", label: "Questions" },
                { num: "~15m", label: "Per Session" },
                { num: "100", label: "Max Score" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>{s.num}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 500, marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            style={{ flex: 1, display: "flex", justifyContent: "center" }}
          >
            <Image
              src="/images/interview-practice.png"
              alt="AI Interview Practice"
              width={420}
              height={420}
              style={{ borderRadius: "20px", objectFit: "cover" }}
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* ─── Benefits Grid ─── */}
      <section style={{ padding: "40px 40px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <motion.h2
          custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "24px", fontWeight: 700, textAlign: "center", margin: "0 0 8px 0", letterSpacing: "-0.03em" }}
        >
          Why Practice With Vocalyst?
        </motion.h2>
        <motion.p
          custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "center", margin: "0 0 40px 0" }}
        >
          Built for engineers who want to perform their best
        </motion.p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{
                background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "14px",
                padding: "24px 20px",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "10px" }}>{b.icon}</div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 6px 0" }}>{b.title}</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", height: "1px", background: "var(--bg-secondary)" }} />

      {/* ─── Interview Selection — Horizontal Scroll ─── */}
      <section style={{ padding: "80px 0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 40px" }}>
          <motion.h2
            custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 8px 0", letterSpacing: "-0.03em" }}
          >
            Choose Your Interview
          </motion.h2>
          <motion.p
            custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 36px 0" }}
          >
            Select a role and click to start your AI-powered mock interview
          </motion.p>
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          style={{
            display: "flex", gap: "24px", overflowX: "auto", padding: "0 40px 20px 40px",
            scrollSnapType: "x mandatory", scrollbarWidth: "none",
          }}
        >
          {INTERVIEWS.map((iv, i) => (
            <motion.div
              key={iv.id}
              custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              onClick={() => router.push(`/interview/${iv.id}`)}
              style={{
                flex: "0 0 480px", scrollSnapAlign: "start",
                background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "20px",
                padding: "36px 32px", cursor: "pointer", transition: "border-color 0.3s",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = iv.color; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; }}
            >
              {/* Top badges */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
                <span style={{
                  padding: "4px 10px", background: "var(--border-subtle)", borderRadius: "6px",
                  fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                }}>
                  {iv.questions} Questions
                </span>
                <span style={{
                  padding: "4px 10px", background: "var(--border-subtle)", borderRadius: "6px",
                  fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600,
                }}>
                  {iv.duration}
                </span>
                <span style={{
                  padding: "4px 10px", background: "var(--border-subtle)", borderRadius: "6px",
                  fontSize: "10px", color: iv.color, fontWeight: 600,
                }}>
                  {iv.difficulty}
                </span>
              </div>

              <div style={{ fontSize: "48px", marginBottom: "16px" }}>{iv.icon}</div>
              <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0", letterSpacing: "-0.02em" }}>{iv.title}</h2>
              <p style={{ fontSize: "13px", color: iv.color, fontWeight: 500, margin: "0 0 14px 0" }}>{iv.subtitle}</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 24px 0", lineHeight: 1.7 }}>{iv.desc}</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "28px" }}>
                {iv.tags.map((tag) => (
                  <span key={tag} style={{
                    padding: "5px 12px", background: "var(--border-subtle)", borderRadius: "6px",
                    fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "14px", background: iv.color, borderRadius: "12px",
                fontSize: "14px", fontWeight: 600, color: "white",
              }}>
                Start Interview
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
              </div>
            </motion.div>
          ))}

          {/* Coming Soon Card */}
          <motion.div
            custom={2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{
              flex: "0 0 480px", scrollSnapAlign: "start",
              background: "var(--bg-secondary)", border: "1px dashed var(--border-subtle)", borderRadius: "20px",
              padding: "36px 32px", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", textAlign: "center",
              opacity: 0.6,
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚀</div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0" }}>More Coming Soon</h2>
            <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0, lineHeight: 1.6, maxWidth: "280px" }}>
              Data Engineer, iOS Developer, Data Scientist, and more interview tracks are on the way.
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <span style={{ fontSize: "11px", color: "var(--border-hover)" }}>Scroll horizontally to see more →</span>
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", height: "1px", background: "var(--bg-secondary)" }} />

      {/* ─── How It Works ─── */}
      <section style={{ padding: "80px 40px", maxWidth: "900px", margin: "0 auto" }}>
        <motion.h2
          custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "24px", fontWeight: 700, textAlign: "center", margin: "0 0 8px 0", letterSpacing: "-0.03em" }}
        >
          How It Works
        </motion.h2>
        <motion.p
          custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "center", margin: "0 0 48px 0" }}
        >
          From click to feedback in minutes
        </motion.p>

        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { num: "01", title: "Choose a Role", desc: "Pick the interview type that matches the job you're targeting.", icon: "🎯", color: "#3b82f6" },
            { num: "02", title: "Answer Questions", desc: "The AI asks 10 role-specific questions. Respond with your voice naturally.", icon: "🎤", color: "#8b5cf6" },
            { num: "03", title: "Review Your Score", desc: "Get a detailed breakdown with scores and feedback for every answer.", icon: "📊", color: "#10b981" },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{
                flex: 1, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                borderRadius: "16px", padding: "28px 22px", textAlign: "center",
              }}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px", background: "var(--border-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px auto", fontSize: "22px",
              }}>
                {step.icon}
              </div>
              <span style={{ fontSize: "11px", color: step.color, fontWeight: 700, letterSpacing: "0.1em" }}>
                STEP {step.num}
              </span>
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "8px 0 6px 0" }}>{step.title}</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", height: "1px", background: "var(--bg-secondary)" }} />

      {/* ─── Testimonials ─── */}
      <section style={{ padding: "80px 40px", maxWidth: "1000px", margin: "0 auto" }}>
        <motion.h2
          custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "24px", fontWeight: 700, textAlign: "center", margin: "0 0 8px 0", letterSpacing: "-0.03em" }}
        >
          What Engineers Say
        </motion.h2>
        <motion.p
          custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "center", margin: "0 0 40px 0" }}
        >
          Trusted by developers preparing for top tech companies
        </motion.p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{
                background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "14px",
                padding: "24px 20px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#f59e0b", marginBottom: "12px", letterSpacing: "2px" }}>
                {"★".repeat(t.rating)}
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: 1.6, fontStyle: "italic" }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0, fontWeight: 600 }}>— {t.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section style={{ padding: "60px 40px 80px", textAlign: "center" }}>
        <motion.h2
          custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 8px 0", letterSpacing: "-0.03em" }}
        >
          Ready to Start?
        </motion.h2>
        <motion.p
          custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 24px 0" }}
        >
          Scroll up to pick a role and begin your mock interview
        </motion.p>
        <motion.button
          custom={2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          style={{
            padding: "14px 32px", background: "#3b82f6", color: "white", border: "none",
            borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
          }}
        >
          Choose Interview ↑
        </motion.button>
      </section>
    </main>
  );
}
