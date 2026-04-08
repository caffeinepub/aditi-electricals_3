import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useChangeMyPin, useChangeWorkerPin } from "../hooks/useQueries";
import type { Worker } from "../types/appTypes";

interface PINChangeModalProps {
  worker: Worker;
  isOwner: boolean;
  onClose: () => void;
}

export default function PINChangeModal({
  worker,
  isOwner,
  onClose,
}: PINChangeModalProps) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const changeWorkerPin = useChangeWorkerPin();
  const changeMyPin = useChangeMyPin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    setError("");

    try {
      if (isOwner) {
        await changeWorkerPin.mutateAsync({
          workerId: worker.workerId,
          newPin,
        });
      } else {
        if (!currentPin) {
          setError("Current PIN is required.");
          return;
        }
        await changeMyPin.mutateAsync({ currentPin, newPin });
      }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to change PIN.");
    }
  };

  const isPending = changeWorkerPin.isPending || changeMyPin.isPending;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 10,
          padding: "28px",
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937" }}>
            Change PIN
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
          {isOwner
            ? `Changing PIN for ${worker.name} (${worker.workerId})`
            : "Change your login PIN"}
        </p>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <p style={{ color: "#166534", fontWeight: 600 }}>
              PIN changed successfully!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!isOwner && (
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="pin-current"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Current PIN
                </label>
                <input
                  id="pin-current"
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  maxLength={8}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #CFCFCF",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3B82F6";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#CFCFCF";
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="pin-new"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                New PIN
              </label>
              <input
                id="pin-new"
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={8}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1.5px solid #CFCFCF",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B82F6";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#CFCFCF";
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="pin-confirm"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Confirm New PIN
              </label>
              <input
                id="pin-confirm"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength={8}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1.5px solid #CFCFCF",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B82F6";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#CFCFCF";
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 16,
                  color: "#991B1B",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "11px",
                  background: "#fff",
                  color: "#374151",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  flex: 2,
                  padding: "11px",
                  background: isPending ? "#93C5FD" : "#3B82F6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isPending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {isPending && (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                )}
                {isPending ? "Saving..." : "Change PIN"}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
