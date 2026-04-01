import type React from "react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { t } from "../lib/i18n";

export default function Login() {
  const { login, language } = useAuth();
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
      setError(result.error || t(language, "invalidCredentials"));
    }
  };

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
      {/* Logo - circular */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <img
          src="/assets/uploads/file_0000000067d07206837b64be921a668c-2-1.png"
          alt="Aditi Electricals"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "block",
            margin: "0 auto",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div
          style={{
            marginTop: 12,
            fontSize: 20,
            fontWeight: 700,
            color: "#1E3A5F",
            letterSpacing: 0.5,
          }}
        >
          Aditi Electricals
        </div>
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
          {t(language, "welcomeBack")}
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#6B7280",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          {t(language, "signInToContinue")}
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
              {t(language, "employeeId")}
            </label>
            <input
              id="login-employee-id"
              data-ocid="login.input"
              type="text"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              placeholder={t(language, "enterEmployeeId")}
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
              {t(language, "pin")}
            </label>
            <input
              id="login-pin"
              data-ocid="login.textarea"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={t(language, "enterPin")}
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
              data-ocid="login.error_state"
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

          <button
            type="submit"
            disabled={loading}
            data-ocid="login.submit_button"
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#93C5FD" : "#3B82F6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? t(language, "signingIn") : t(language, "signIn")}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 12,
            color: "#9CA3AF",
          }}
        >
          © {new Date().getFullYear()}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#9CA3AF", textDecoration: "none" }}
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
