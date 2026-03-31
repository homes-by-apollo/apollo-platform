import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-horizontal_578ef147.png";
const NAVY = "#0f2044";
const GOLD = "#c8a96e";
const MUT = "#6b7280";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setError("No reset token found. Please request a new password reset link.");
    } else {
      setToken(t);
    }
  }, []);

  const resetMutation = trpc.adminAuth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setLocation("/admin-login"), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to reset password. The link may have expired.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid reset token. Please request a new link.");
      return;
    }

    resetMutation.mutate({ token, newPassword: password });
  };

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

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

        {success ? (
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
            <h1 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: "0 0 12px" }}>Password updated!</h1>
            <p style={{ fontSize: 14, color: MUT, lineHeight: 1.65, margin: "0 0 4px" }}>
              Your password has been changed successfully.
            </p>
            <p style={{ fontSize: 13, color: MUT, margin: "0 0 28px" }}>
              Redirecting to sign in…
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
              Sign In Now
            </a>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, textAlign: "center", margin: "0 0 8px" }}>
              Set New Password
            </h1>
            <p style={{ fontSize: 14, color: MUT, textAlign: "center", margin: "0 0 28px", lineHeight: 1.6 }}>
              Choose a strong password for your admin account.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* New Password */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    autoFocus
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: MUT }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 10,
                      border: `1.5px solid ${error && password !== confirmPassword ? "#e53e3e" : "#d1d5db"}`,
                      padding: "0 44px 0 14px",
                      fontSize: 15,
                      color: NAVY,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={e => (e.target.style.borderColor = NAVY)}
                    onBlur={e => (e.target.style.borderColor = "#d1d5db")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: MUT }}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
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
                disabled={resetMutation.isPending || !token}
                style={{
                  height: 52,
                  borderRadius: 10,
                  background: (resetMutation.isPending || !token) ? "#6b7280" : NAVY,
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                  border: "none",
                  cursor: (resetMutation.isPending || !token) ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                  marginTop: 4,
                  letterSpacing: "0.01em",
                }}
              >
                {resetMutation.isPending ? "Updating…" : "Update Password"}
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
