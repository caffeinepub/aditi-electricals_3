import type React from "react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, actorReady } = useAuth();
  const [workerId, setWorkerId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId.trim() || !pin.trim()) {
      setError("Please enter both Employee ID and PIN.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(workerId, pin);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Invalid credentials. Please try again.");
    }
  };

  const isConnecting = !actorReady;
  const buttonDisabled = loading || isConnecting;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F6F8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <img
          src="/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png"
          alt="Aditi Electricals"
          style={{ width: 200, height: "auto", objectFit: "contain" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Login Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 10,
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          padding: "36px 32px",
          width: "100%",
          maxWidth: 400,
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1E3A5F",
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          Welcome Back
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          Sign in to Aditi Electricals
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="login-employee-id"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Employee ID
            </label>
            <input
              id="login-employee-id"
              type="text"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              placeholder="e.g. OWNER1 or W001"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1.5px solid #CFCFCF",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                background: "#fff",
                color: "#111",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3B82F6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#CFCFCF";
              }}
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="login-pin"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              PIN
            </label>
            <input
              id="login-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
              maxLength={8}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1.5px solid #CFCFCF",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                background: "#fff",
                color: "#111",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3B82F6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#CFCFCF";
              }}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 18,
                color: "#991B1B",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {isConnecting && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 14,
                fontSize: 12,
                color: "#1D4ED8",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  border: "2px solid #93C5FD",
                  borderTopColor: "#1D4ED8",
                  borderRadius: "50%",
                  display: "inline-block",
                  flexShrink: 0,
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Connecting to server…
            </div>
          )}

          <button
            type="submit"
            disabled={buttonDisabled}
            data-ocid="login.submit_button"
            style={{
              width: "100%",
              padding: "12px",
              background: buttonDisabled ? "#93C5FD" : "#3B82F6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: buttonDisabled ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {(loading || isConnecting) && (
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            )}
            {loading
              ? "Signing in..."
              : isConnecting
                ? "Connecting..."
                : "Sign In"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 32,
          textAlign: "center",
          fontSize: 12,
          color: "#9CA3AF",
        }}
      >
        <p>
          © {new Date().getFullYear()} Aditi Electricals. All rights reserved.
        </p>
        <p style={{ marginTop: 4 }}>
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3B82F6", textDecoration: "none" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>

      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
