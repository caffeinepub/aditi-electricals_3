import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { type AttendanceRecord, AttendanceStatus } from "../../backend";
import AttendanceCalendar from "../../components/AttendanceCalendar";
import {
  useGetAllHolidays,
  useGetAllWorkers,
  useGetAttendanceByWorkerForMonth,
  useOwnerAddAttendance,
  useOwnerDeleteAttendance,
  useOwnerGetAttendanceByWorkerForMonth,
  useOwnerUpdateAttendance,
} from "../../hooks/useQueries";
import { getCurrentMonthYear, getMonthName } from "../../utils/dateUtils";

interface Props {
  initialWorkerId?: string | null;
}

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  bg: string;
  color: string;
}[] = [
  {
    value: AttendanceStatus.present,
    label: "Present",
    bg: "#166534",
    color: "#fff",
  },
  {
    value: AttendanceStatus.absent,
    label: "Absent",
    bg: "#991B1B",
    color: "#fff",
  },
  {
    value: AttendanceStatus.leave,
    label: "Leave",
    bg: "#92400E",
    color: "#fff",
  },
  {
    value: AttendanceStatus.holiday,
    label: "Holiday",
    bg: "#4B5563",
    color: "#fff",
  },
];

function LocationPreview({
  latitude,
  longitude,
}: { latitude: number; longitude: number }) {
  const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.005},${longitude + 0.005},${latitude + 0.005}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #E5E7EB",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          background: "#F9FAFB",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <MapPin size={14} color="#3B82F6" />
        <span style={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>
          Location at check-in
        </span>
      </div>
      <div style={{ height: 160 }}>
        <iframe
          src={osmUrl}
          title="Attendance location"
          style={{ width: "100%", height: "100%", border: "none" }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <div
        style={{
          padding: "8px 12px",
          background: "#F9FAFB",
          borderTop: "1px solid #E5E7EB",
        }}
      >
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 500,
            color: "#3B82F6",
            textDecoration: "none",
          }}
        >
          <ExternalLink size={12} />
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}

export default function AttendanceManagement({ initialWorkerId }: Props) {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const { data: workers = [] } = useGetAllWorkers();
  const { data: holidays = [] } = useGetAllHolidays();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(
    initialWorkerId || null,
  );
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [actionError, setActionError] = useState("");

  const selectedWorker = workers.find((w) => w.workerId === selectedWorkerId);

  // ── SHARED DATA SOURCE ──────────────────────────────────────────────────────
  // Use the same endpoint as workers so both views read from ONE data store.
  const {
    data: calendarRecords = [],
    isLoading: attendanceLoading,
    refetch: refetchCalendar,
  } = useGetAttendanceByWorkerForMonth(selectedWorkerId || "", month, year);

  // Owner-only endpoint returns full records (with location/photo) for the dialog.
  const { data: ownerRecords = [], refetch: refetchOwnerRecords } =
    useOwnerGetAttendanceByWorkerForMonth(selectedWorkerId || "", month, year);
  // ────────────────────────────────────────────────────────────────────────────

  const addAttendance = useOwnerAddAttendance();
  const updateAttendance = useOwnerUpdateAttendance();
  const deleteAttendance = useOwnerDeleteAttendance();

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const handleDateClick = (date: string) => {
    // Use the full owner record (has location/photo) when available;
    // fall back to the shared calendar record for status info.
    const fullRecord =
      ownerRecords.find((r) => r.date === date) ||
      (calendarRecords.find(
        (r) => r.date === date,
      ) as unknown as AttendanceRecord) ||
      null;
    setSelectedDate(date);
    setExistingRecord(fullRecord);
    setActionError("");
    setDialogOpen(true);
  };

  const refetchAll = () => {
    refetchCalendar();
    refetchOwnerRecords();
  };

  const handleSetStatus = async (status: AttendanceStatus) => {
    if (!selectedWorkerId) return;
    setActionError("");
    try {
      if (existingRecord) {
        await updateAttendance.mutateAsync({
          recordId: existingRecord.recordId,
          status,
        });
      } else {
        await addAttendance.mutateAsync({
          workerId: selectedWorkerId,
          date: selectedDate,
          status,
        });
      }
      setDialogOpen(false);
      refetchAll();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to update attendance";
      setActionError(msg);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;
    setActionError("");
    try {
      await deleteAttendance.mutateAsync(existingRecord.recordId);
      setDialogOpen(false);
      refetchAll();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      setActionError(msg);
    }
  };

  const isLoading =
    addAttendance.isPending ||
    updateAttendance.isPending ||
    deleteAttendance.isPending;

  const hasLocation =
    existingRecord &&
    existingRecord.latitude != null &&
    existingRecord.longitude != null;

  const _cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    padding: 20,
    marginBottom: 16,
  };

  if (!selectedWorkerId) {
    return (
      <div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1F2937",
            marginBottom: 8,
          }}
        >
          Attendance Management
        </h2>
        <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>
          Select a worker to view and manage their attendance.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {workers.map((w) => (
            <button
              type="button"
              key={w.workerId}
              onClick={() => setSelectedWorkerId(w.workerId)}
              style={{
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                padding: "16px 20px",
                border: "1px solid #E5E7EB",
                cursor: "pointer",
                textAlign: "left",
                transition: "box-shadow 0.15s",
              }}
            >
              <div style={{ fontWeight: 600, color: "#1F2937", fontSize: 15 }}>
                {w.name}
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                {w.workerId}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedWorkerId(null)}
          style={{
            background: "#F3F4F6",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            color: "#374151",
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1F2937",
              margin: 0,
            }}
          >
            {selectedWorker?.name}
          </h2>
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
            {selectedWorkerId}
          </p>
        </div>
      </div>

      {/* Month Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={prevMonth}
          style={{
            background: "#F3F4F6",
            border: "none",
            borderRadius: 6,
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#374151",
            minWidth: 130,
            textAlign: "center",
          }}
        >
          {getMonthName(month)} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{
            background: "#F3F4F6",
            border: "none",
            borderRadius: 6,
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar — uses shared attendance records (same data source as worker) */}
      {attendanceLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
          Loading attendance...
        </div>
      ) : (
        <AttendanceCalendar
          workerId={selectedWorkerId}
          month={month}
          year={year}
          attendanceRecords={calendarRecords}
          holidays={holidays}
          onDateClick={(date) => handleDateClick(date)}
          isOwner={true}
        />
      )}

      {/* Date Detail Dialog */}
      {dialogOpen && (
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
              padding: 24,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                {existingRecord ? "Update Attendance" : "Set Attendance"} —{" "}
                {selectedDate}
              </h3>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {existingRecord && (
              <div
                style={{
                  background: "#F9FAFB",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 12,
                  fontSize: 13,
                  color: "#374151",
                }}
              >
                Current:{" "}
                <strong style={{ textTransform: "capitalize" }}>
                  {String(existingRecord.status)}
                </strong>
                {existingRecord.markedBy && (
                  <span style={{ color: "#9CA3AF", marginLeft: 8 }}>
                    by {existingRecord.markedBy}
                  </span>
                )}
              </div>
            )}

            {hasLocation && existingRecord && (
              <LocationPreview
                latitude={existingRecord.latitude as number}
                longitude={existingRecord.longitude as number}
              />
            )}

            {existingRecord?.photo && (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #E5E7EB",
                }}
              >
                <img
                  src={existingRecord.photo.getDirectURL()}
                  alt="Worker attendance"
                  style={{ width: "100%", maxHeight: 180, objectFit: "cover" }}
                />
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 16,
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={String(opt.value)}
                  onClick={() => handleSetStatus(opt.value)}
                  disabled={isLoading}
                  style={{
                    padding: "10px",
                    background: opt.bg,
                    color: opt.color,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  {isLoading ? (
                    <Loader2
                      size={14}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                  ) : (
                    opt.label
                  )}
                </button>
              ))}
            </div>

            {actionError && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginTop: 12,
                  color: "#991B1B",
                  fontSize: 13,
                }}
              >
                {actionError}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {existingRecord && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#FEF2F2",
                    color: "#991B1B",
                    border: "1px solid #FECACA",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#fff",
                  color: "#374151",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
