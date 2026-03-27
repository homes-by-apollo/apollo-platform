import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo_31888db6.webp";
const NAVY = "#0f2044";
const GOLD = "#c8a96e";
const MUT = "#6b7280";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: () => {
      setLocation("/crm");
    },
    onError: (err) => {
      setError(err.message || "Invalid email or password.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f6fa",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    }}>
      {/* Card */}
      <div style={{
        background: "white",
        borderRadius: 20,
        boxShadow: "0 8px 40px rgba(15,32,68,0.12)",
        padding: "48px 44px",
        width: "100%",
        maxWidth: 420,
      }}>
        {/* Logo + wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <img src={LOGO} alt="Homes by Apollo" style={{ width: 56, height: 56, marginBottom: 12 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: MUT, textTransform: "uppercase" }}>Homes by</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.08em", color: NAVY, textTransform: "uppercase", lineHeight: 1 }}>Apollo</div>
          </div>
          <div style={{ width: 40, height: 2, background: GOLD, borderRadius: 2, marginTop: 14 }} />
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, textAlign: "center", margin: "0 0 6px" }}>
          Admin Access
        </h1>
        <p style={{ fontSize: 14, color: MUT, textAlign: "center", margin: "0 0 32px", lineHeight: 1.5 }}>
          Sign in to manage listings, leads, and site content.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@apollohomebuilders.com"
              autoComplete="email"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 10,
                border: `1.5px solid ${error ? "#e53e3e" : "#d1d5db"}`,
                padding: "0 14px",
                fontSize: 15,
                color: NAVY,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = NAVY)}
              onBlur={e => (e.target.style.borderColor = error ? "#e53e3e" : "#d1d5db")}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 10,
                  border: `1.5px solid ${error ? "#e53e3e" : "#d1d5db"}`,
                  padding: "0 44px 0 14px",
                  fontSize: 15,
                  color: NAVY,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = NAVY)}
                onBlur={e => (e.target.style.borderColor = error ? "#e53e3e" : "#d1d5db")}
              />
              {/* Show/hide toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: 4, color: MUT,
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: "#fff5f5",
              border: "1px solid #fed7d7",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#c53030",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            style={{
              height: 52,
              borderRadius: 10,
              background: loginMutation.isPending ? "#6b7280" : NAVY,
              color: "white",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              cursor: loginMutation.isPending ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              marginTop: 4,
              letterSpacing: "0.01em",
            }}
          >
            {loginMutation.isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>

      {/* Back to site link */}
      <a
        href="/"
        style={{
          marginTop: 24,
          fontSize: 13,
          color: MUT,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to apollohomebuilders.com
      </a>
    </div>
  );
}
