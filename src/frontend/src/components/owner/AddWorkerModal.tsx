import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAddWorker } from "../../hooks/useQueries";

interface AddWorkerModalProps {
  onClose: () => void;
  onSuccess?: (workerId: string) => void;
}

export default function AddWorkerModal({
  onClose,
  onSuccess,
}: AddWorkerModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [salary, setSalary] = useState("");
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");

  const addWorker = useAddWorker();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!salary || Number.isNaN(Number(salary)) || Number(salary) < 0) {
      setError("Please enter a valid salary.");
      return;
    }
    setError("");
    try {
      const workerId = await addWorker.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
        monthlySalary: Number(salary),
      });
      setSuccessId(workerId);
      onSuccess?.(workerId);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(
        msg.includes("Unauthorized") ? "Only the owner can add workers." : msg,
      );
    }
  };

  if (successId) {
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
            background: "#fff",
            borderRadius: 10,
            padding: 32,
            maxWidth: 380,
            width: "100%",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "#DCFCE7",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <span style={{ fontSize: 24 }}>✓</span>
          </div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#166534",
              marginBottom: 8,
            }}
          >
            Worker Added!
          </h3>
          <p style={{ color: "#374151", marginBottom: 8 }}>
            Worker ID: <strong>{successId}</strong>
          </p>
          <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 24 }}>
            Default PIN: <strong>0000</strong>
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#3B82F6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

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
          padding: "28px 28px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937" }}>
            Add New Worker
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="add-worker-name"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              id="add-worker-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
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

          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="add-worker-mobile"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Mobile (optional)
            </label>
            <input
              id="add-worker-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
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
              htmlFor="add-worker-salary"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Monthly Salary (₹) <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              id="add-worker-salary"
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. 15000"
              min="0"
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
              disabled={addWorker.isPending}
              style={{
                flex: 2,
                padding: "11px",
                background: addWorker.isPending ? "#93C5FD" : "#3B82F6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: addWorker.isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {addWorker.isPending && (
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
              {addWorker.isPending ? "Adding..." : "Add Worker"}
            </button>
          </div>
        </form>
      </div>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
