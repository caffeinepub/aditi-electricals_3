import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Worker } from "../../backend";
import { useUpdateWorker } from "../../hooks/useQueries";

interface EditWorkerModalProps {
  worker: Worker;
  onClose: () => void;
}

export default function EditWorkerModal({
  worker,
  onClose,
}: EditWorkerModalProps) {
  const [name, setName] = useState(worker.name);
  const [mobile, setMobile] = useState(worker.mobile);
  const [salary, setSalary] = useState(String(worker.monthlySalary));
  const [active, setActive] = useState(worker.active);
  const [error, setError] = useState("");

  const updateWorker = useUpdateWorker();

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
      await updateWorker.mutateAsync({
        workerId: worker.workerId,
        name: name.trim(),
        mobile: mobile.trim(),
        monthlySalary: Number(salary),
        pin: worker.pin,
        active,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update worker.");
    }
  };

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
            Edit Worker
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
              htmlFor="edit-worker-name"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Name *
            </label>
            <input
              id="edit-worker-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              htmlFor="edit-worker-mobile"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Mobile
            </label>
            <input
              id="edit-worker-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
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
              htmlFor="edit-worker-salary"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Monthly Salary (₹) *
            </label>
            <input
              id="edit-worker-salary"
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
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

          <div
            style={{
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <label
              htmlFor="active"
              style={{ fontSize: 14, color: "#374151", cursor: "pointer" }}
            >
              Active Worker
            </label>
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
              disabled={updateWorker.isPending}
              style={{
                flex: 2,
                padding: "11px",
                background: updateWorker.isPending ? "#93C5FD" : "#3B82F6",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: updateWorker.isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {updateWorker.isPending && (
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
              {updateWorker.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
