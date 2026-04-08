import {
  DollarSign,
  Edit2,
  Key,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import PINChangeModal from "../../components/PINChangeModal";
import AddWorkerModal from "../../components/owner/AddWorkerModal";
import EditWorkerModal from "../../components/owner/EditWorkerModal";
import { useDeleteWorker, useGetAllWorkers } from "../../hooks/useQueries";
import type { Worker } from "../../types/appTypes";

interface WorkerManagementProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function WorkerManagement({
  onNavigate,
}: WorkerManagementProps) {
  const { data: workers = [], isLoading } = useGetAllWorkers();
  const deleteWorker = useDeleteWorker();

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [pinWorker, setPinWorker] = useState<Worker | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const filtered = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.workerId.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (workerId: string) => {
    setDeleteError("");
    try {
      await deleteWorker.mutateAsync(workerId);
      setDeleteConfirm(null);
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete worker.");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2937" }}>
          Worker Management
        </h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          style={{
            background: "#3B82F6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={16} /> Add Worker
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9CA3AF",
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or ID..."
          style={{
            width: "100%",
            padding: "10px 12px 10px 36px",
            border: "1.5px solid #E5E7EB",
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            background: "#fff",
          }}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
          Loading workers...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ color: "#6B7280", fontSize: 15 }}>
            {search ? "No workers match your search." : "No workers added yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((worker) => (
            <div
              key={worker.workerId}
              style={{
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        background: "#EFF6FF",
                        color: "#3B82F6",
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {worker.workerId}
                    </span>
                    {!worker.active && (
                      <span
                        style={{
                          background: "#FEF2F2",
                          color: "#991B1B",
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#1F2937",
                      marginBottom: 4,
                    }}
                  >
                    {worker.name}
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {worker.mobile && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 13,
                          color: "#6B7280",
                        }}
                      >
                        <Phone size={13} /> {worker.mobile}
                      </span>
                    )}
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        color: "#6B7280",
                      }}
                    >
                      <DollarSign size={13} /> ₹
                      {Number(worker.monthlySalary).toLocaleString("en-IN")}
                      /month
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate("attendance", { workerId: worker.workerId })
                    }
                    style={{
                      background: "#F0FDF4",
                      color: "#166534",
                      border: "1px solid #BBF7D0",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    title="View Attendance"
                  >
                    Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate("salary", { workerId: worker.workerId })
                    }
                    style={{
                      background: "#FFF7ED",
                      color: "#92400E",
                      border: "1px solid #FED7AA",
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    title="View Salary"
                  >
                    Salary
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinWorker(worker)}
                    style={{
                      background: "#F5F3FF",
                      color: "#5B21B6",
                      border: "1px solid #DDD6FE",
                      borderRadius: 6,
                      padding: "6px 8px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    title="Change PIN"
                  >
                    <Key size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditWorker(worker)}
                    style={{
                      background: "#EFF6FF",
                      color: "#3B82F6",
                      border: "1px solid #BFDBFE",
                      borderRadius: 6,
                      padding: "6px 8px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(worker.workerId)}
                    style={{
                      background: "#FEF2F2",
                      color: "#991B1B",
                      border: "1px solid #FECACA",
                      borderRadius: 6,
                      padding: "6px 8px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
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
              padding: 28,
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            }}
          >
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1F2937",
                marginBottom: 12,
              }}
            >
              Delete Worker?
            </h3>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>
              This will permanently delete worker{" "}
              <strong>{deleteConfirm}</strong>. This action cannot be undone.
            </p>
            {deleteError && (
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
                {deleteError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteError("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fff",
                  color: "#374151",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteWorker.isPending}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#991B1B",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleteWorker.isPending ? "not-allowed" : "pointer",
                }}
              >
                {deleteWorker.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddWorkerModal onClose={() => setShowAdd(false)} />}
      {editWorker && (
        <EditWorkerModal
          worker={editWorker}
          onClose={() => setEditWorker(null)}
        />
      )}
      {pinWorker && (
        <PINChangeModal
          worker={pinWorker}
          isOwner={true}
          onClose={() => setPinWorker(null)}
        />
      )}
    </div>
  );
}
