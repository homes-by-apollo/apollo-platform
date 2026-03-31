import { useState } from "react";
import { trpc } from "@/lib/trpc";

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-horizontal_578ef147.png";
const NAVY = "#0f2044";
const GOLD = "#c8a96e";
const MUT = "#6b7280";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const requestResetMutation = trpc.adminAuth.requestReset.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    requestResetMutation.mutate({ email, origin: window.location.origin });
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
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <img src={LOGO} alt="Homes by Apollo" style={{ height: 84, maxWidth: 360, objectFit: "contain" }} />
          <div style={{ width: 40, height: 2, background: GOLD, borderRadius: 2, marginTop: 16 }} />
        </div>

        {submitted ? (
          /* Success state */
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#f0fdf4", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: "0 0 12px" }}>Check your email</h1>
            <p style={{ fontSize: 14, color: MUT, lineHeight: 1.65, margin: "0 0 28px" }}>
              If <strong style={{ color: NAVY }}>{email}</strong> is registered, you'll receive a password reset link shortly. The link expires in 1 hour.
            </p>
            <a
              href="/admin-login"
              style={{
                display: "block", height: 48, borderRadius: 10,
                background: NAVY, color: "white", fontSize: 15,
                fontWeight: 700, textDecoration: "none", lineHeight: "48px",
                textAlign: "center",
              }}
            >
              Back to Sign In
            </a>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, textAlign: "center", margin: "0 0 8px" }}>
              Forgot Password
            </h1>
            <p style={{ fontSize: 14, color: MUT, textAlign: "center", margin: "0 0 28px", lineHeight: 1.6 }}>
              Enter your admin email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                  autoFocus
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

              <button
                type="submit"
                disabled={requestResetMutation.isPending}
                style={{
                  height: 52,
                  borderRadius: 10,
                  background: requestResetMutation.isPending ? "#6b7280" : NAVY,
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                  border: "none",
                  cursor: requestResetMutation.isPending ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                  marginTop: 4,
                  letterSpacing: "0.01em",
                }}
              >
                {requestResetMutation.isPending ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Back to login */}
      <a
        href="/admin-login"
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
        Back to Sign In
      </a>
    </div>
  );
}
