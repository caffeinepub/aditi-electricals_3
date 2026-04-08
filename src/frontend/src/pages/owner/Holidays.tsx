import type React from "react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  useAddHoliday,
  useDeleteHoliday,
  useEditHoliday,
  useGetAllHolidays,
} from "../../hooks/useQueries";
import type { Holiday } from "../../types/appTypes";
import { formatDate } from "../../utils/dateUtils";

export default function Holidays() {
  const { user } = useAuth();
  const { data: holidays = [], isLoading } = useGetAllHolidays();
  const addHolidayMutation = useAddHoliday();
  const editHolidayMutation = useEditHoliday();
  const deleteHolidayMutation = useDeleteHoliday();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    description: "",
  });
  const [error, setError] = useState("");

  const isOwner = user?.role === "owner";

  const resetForm = () => {
    setFormData({ date: "", name: "", description: "" });
    setError("");
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddForm(true);
    setEditingHoliday(null);
  };

  const handleEditClick = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: holiday.date,
      name: holiday.name,
      description: holiday.description ?? "",
    });
    setShowAddForm(false);
    setError("");
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.name.trim()) {
      setError("Date and Holiday Name are required.");
      return;
    }
    try {
      await addHolidayMutation.mutateAsync({
        date: formData.date,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      });
      resetForm();
      setShowAddForm(false);
    } catch (err: any) {
      setError(err?.message || "Failed to add holiday.");
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday) return;
    if (!formData.date || !formData.name.trim()) {
      setError("Date and Holiday Name are required.");
      return;
    }
    try {
      await editHolidayMutation.mutateAsync({
        holidayId: editingHoliday.holidayId,
        date: formData.date,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      });
      setEditingHoliday(null);
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Failed to update holiday.");
    }
  };

  const handleDelete = async (holidayId: string) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await deleteHolidayMutation.mutateAsync(holidayId);
    } catch (err: any) {
      alert(err?.message || "Failed to delete holiday.");
    }
  };

  const sortedHolidays = [...holidays].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #CFCFCF",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#fff",
    color: "#1a1a1a",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#444",
    marginBottom: "4px",
  };

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#1a1a1a",
            margin: 0,
          }}
        >
          Holidays
        </h2>
        {isOwner && (
          <button
            type="button"
            onClick={handleAddClick}
            style={{
              backgroundColor: "#0EA5E9",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Holiday
          </button>
        )}
      </div>

      {/* Add Form */}
      {isOwner && showAddForm && (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Add New Holiday
          </h3>
          <form onSubmit={handleSubmitAdd}>
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="add-holiday-date" style={labelStyle}>
                Date *
              </label>
              <input
                id="add-holiday-date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="add-holiday-name" style={labelStyle}>
                Holiday Name *
              </label>
              <input
                id="add-holiday-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Diwali"
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="add-holiday-desc" style={labelStyle}>
                Holiday Description (optional)
              </label>
              <textarea
                id="add-holiday-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add a description..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
            {error && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "13px",
                  marginBottom: "10px",
                }}
              >
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={addHolidayMutation.isPending}
                style={{
                  backgroundColor: "#0EA5E9",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: addHolidayMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                  opacity: addHolidayMutation.isPending ? 0.7 : 1,
                }}
              >
                {addHolidayMutation.isPending ? "Saving..." : "Save Holiday"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                style={{
                  backgroundColor: "#fff",
                  color: "#444",
                  border: "1px solid #CFCFCF",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {isOwner && editingHoliday && (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Edit Holiday
          </h3>
          <form onSubmit={handleSubmitEdit}>
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="edit-holiday-date" style={labelStyle}>
                Date *
              </label>
              <input
                id="edit-holiday-date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="edit-holiday-name" style={labelStyle}>
                Holiday Name *
              </label>
              <input
                id="edit-holiday-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Diwali"
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label htmlFor="edit-holiday-desc" style={labelStyle}>
                Holiday Description (optional)
              </label>
              <textarea
                id="edit-holiday-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add a description..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
            {error && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "13px",
                  marginBottom: "10px",
                }}
              >
                {error}
              </p>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={editHolidayMutation.isPending}
                style={{
                  backgroundColor: "#0EA5E9",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: editHolidayMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                  opacity: editHolidayMutation.isPending ? 0.7 : 1,
                }}
              >
                {editHolidayMutation.isPending ? "Saving..." : "Update Holiday"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingHoliday(null);
                  resetForm();
                }}
                style={{
                  backgroundColor: "#fff",
                  color: "#444",
                  border: "1px solid #CFCFCF",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Holiday List */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
          Loading holidays...
        </div>
      ) : sortedHolidays.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#888",
            backgroundColor: "#fff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
          }}
        >
          No holidays added yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sortedHolidays.map((holiday) => (
            <div
              key={holiday.holidayId}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#EFF6FF",
                        color: "#1D4ED8",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {formatDate(holiday.date)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      margin: "4px 0 0 0",
                    }}
                  >
                    {holiday.name}
                  </p>
                  {holiday.description && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#555",
                        margin: "6px 0 0 0",
                        lineHeight: "1.5",
                      }}
                    >
                      {holiday.description}
                    </p>
                  )}
                </div>
                {isOwner && (
                  <div
                    style={{ display: "flex", gap: "8px", marginLeft: "12px" }}
                  >
                    <button
                      type="button"
                      onClick={() => handleEditClick(holiday)}
                      style={{
                        backgroundColor: "#F0F9FF",
                        color: "#0EA5E9",
                        border: "1px solid #BAE6FD",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(holiday.holidayId)}
                      disabled={deleteHolidayMutation.isPending}
                      style={{
                        backgroundColor: "#FEF2F2",
                        color: "#EF4444",
                        border: "1px solid #FECACA",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
