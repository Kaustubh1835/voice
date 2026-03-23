"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
      router.push("/signin");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "var(--bg-primary)" }}>
      <div style={{ position: "absolute", top: "24px", right: "24px" }}>
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        style={{ width: "100%", maxWidth: "400px", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "20px", padding: "40px 32px" }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "24px", display: "block", marginBottom: "12px" }}>⚡</span>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0", letterSpacing: "-0.03em" }}>Create an account</h1>
          <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0 }}>Get started with Vocalyst</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500 }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name"
              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
            />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters"
              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "14px", outline: "none", transition: "border-color 0.2s" }}
            />
          </div>

          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#ef4444", fontSize: "12px", marginBottom: "16px" }}>{error}</motion.p>}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Creating account..." : "Sign Up"}
          </motion.button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-dim)", marginTop: "24px" }}>
          Already have an account?{" "}
          <Link href="/signin" style={{ color: "#3b82f6", fontWeight: 500 }}>Sign in</Link>
        </p>
      </motion.div>
    </main>
  );
}
