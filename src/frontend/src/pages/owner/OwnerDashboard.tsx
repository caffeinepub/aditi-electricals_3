import {
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import {
  useGetAllWorkers,
  useGetConfirmationsByDate,
  useGetDashboardStats,
  useGetMonthlySummary,
  useOwnerGetAttendanceForDate,
} from "../../hooks/useQueries";
import {
  getCurrentMonthYear,
  getMonthName,
  getTodayString,
} from "../../utils/dateUtils";

interface OwnerDashboardProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function OwnerDashboard({
  onNavigate: _onNavigate,
}: OwnerDashboardProps) {
  const today = getTodayString();
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: summary = [], isLoading: summaryLoading } =
    useGetMonthlySummary(month, year);
  const { data: workers = [] } = useGetAllWorkers();
  const { data: confirmations = [] } = useGetConfirmationsByDate(today);
  const { data: todayAttendance = [] } = useOwnerGetAttendanceForDate(today);

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

  const workerMap = Object.fromEntries(workers.map((w) => [w.workerId, w]));

  const statCards = [
    {
      label: "Total Workers",
      value: stats ? Number(stats.totalWorkers) : 0,
      icon: Users,
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
    {
      label: "Today Present",
      value: stats ? Number(stats.todayPresent) : 0,
      icon: UserCheck,
      color: "#166534",
      bg: "#F0FDF4",
    },
    {
      label: "Today Absent",
      value: stats ? Number(stats.todayAbsent) : 0,
      icon: UserX,
      color: "#991B1B",
      bg: "#FEF2F2",
    },
    {
      label: "2PM Confirmations",
      value: stats ? Number(stats.twoPMConfirmations) : 0,
      icon: Clock,
      color: "#92400E",
      bg: "#FFF7ED",
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1F2937",
          marginBottom: 20,
        }}
      >
        Dashboard
      </h1>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                padding: "18px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: card.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} color={card.color} />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: card.color }}>
                {statsLoading ? "—" : card.value}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Attendance */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "20px",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          Today's Attendance
        </h2>
        {todayAttendance.length === 0 ? (
          <p style={{ color: "#9CA3AF", fontSize: 14 }}>
            No attendance records for today.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {todayAttendance.map((rec) => {
              const worker = workerMap[rec.workerId];
              const statusStr =
                typeof rec.status === "object"
                  ? Object.keys(rec.status)[0]
                  : String(rec.status);
              const colors: Record<string, { bg: string; text: string }> = {
                present: { bg: "#166534", text: "#fff" },
                absent: { bg: "#991B1B", text: "#fff" },
                leave: { bg: "#92400E", text: "#fff" },
                holiday: { bg: "#4B5563", text: "#fff" },
              };
              const c = colors[statusStr] || { bg: "#E5E7EB", text: "#374151" };
              return (
                <div
                  key={rec.recordId}
                  style={{
                    background: c.bg,
                    color: c.text,
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {worker?.name || rec.workerId} — {statusStr}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2PM Confirmations */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "20px",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          2PM Confirmations — Today
        </h2>
        {confirmations.length === 0 ? (
          <p style={{ color: "#9CA3AF", fontSize: 14 }}>
            No confirmations yet today.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {confirmations.map((conf) => {
              const worker = workerMap[conf.workerId];
              const time = conf.confirmedAt
                ? new Date(
                    Number(conf.confirmedAt) / 1_000_000,
                  ).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "—";
              return (
                <div
                  key={conf.confirmationId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#F0FDF4",
                    borderRadius: 8,
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}
                  >
                    {worker?.name || conf.workerId}
                  </span>
                  <span style={{ fontSize: 12, color: "#166534" }}>
                    Confirmed at {time}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
            Monthly Summary
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                minWidth: 120,
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
        </div>

        {summaryLoading ? (
          <div style={{ textAlign: "center", padding: 20, color: "#6B7280" }}>
            Loading...
          </div>
        ) : summary.length === 0 ? (
          <p style={{ color: "#9CA3AF", fontSize: 14 }}>
            No data for this month.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "#6B7280",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    Worker
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      color: "#166534",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    Present
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      color: "#991B1B",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    Absent
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      color: "#92400E",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    Leave
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.map((entry) => (
                  <tr
                    key={entry.workerId}
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: "#1F2937" }}>
                        {entry.workerName}
                      </div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                        {entry.workerId}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>
                      <span
                        style={{
                          background: "#166534",
                          color: "#fff",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {Number(entry.presentDays)}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>
                      <span
                        style={{
                          background: "#991B1B",
                          color: "#fff",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {Number(entry.absentDays)}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>
                      <span
                        style={{
                          background: "#92400E",
                          color: "#fff",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {Number(entry.leaveDays)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
