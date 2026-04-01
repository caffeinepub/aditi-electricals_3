import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import TwoPMConfirmationPopup from "../../components/worker/TwoPMConfirmationPopup";
import { useAuth } from "../../contexts/AuthContext";
import {
  useGetAttendanceByWorker,
  useGetMyConfirmation,
} from "../../hooks/useQueries";
import { t } from "../../lib/i18n";
import { getTodayString, isAfter2PM } from "../../utils/dateUtils";

export default function WorkerDashboard() {
  const { user, language } = useAuth();
  const workerId = user?.workerId || "";
  const today = getTodayString();

  const { data: attendanceRecords = [] } = useGetAttendanceByWorker(workerId);
  const { data: confirmation } = useGetMyConfirmation(workerId, today);

  const todayRecord = attendanceRecords.find((r) => r.date === today);
  const todayStatus = todayRecord
    ? typeof todayRecord.status === "object"
      ? Object.keys(todayRecord.status)[0]
      : String(todayRecord.status)
    : undefined;

  const getStatusDisplay = () => {
    if (!todayStatus)
      return {
        label: t(language, "notMarked"),
        color: "#6B7280",
        bg: "#F3F4F6",
        icon: <Clock size={18} />,
      };
    if (todayStatus === "present")
      return {
        label: t(language, "present"),
        color: "#166534",
        bg: "#F0FDF4",
        icon: <CheckCircle size={18} />,
      };
    if (todayStatus === "absent")
      return {
        label: t(language, "absent"),
        color: "#991B1B",
        bg: "#FEF2F2",
        icon: <XCircle size={18} />,
      };
    if (todayStatus === "leave")
      return {
        label: t(language, "onLeave"),
        color: "#92400E",
        bg: "#FFF7ED",
        icon: <Clock size={18} />,
      };
    if (todayStatus === "holiday")
      return {
        label: t(language, "holiday"),
        color: "#4B5563",
        bg: "#F9FAFB",
        icon: <Calendar size={18} />,
      };
    return {
      label: todayStatus,
      color: "#6B7280",
      bg: "#F3F4F6",
      icon: <Clock size={18} />,
    };
  };

  const statusDisplay = getStatusDisplay();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthRecords = attendanceRecords.filter((r) => {
    const [y, m] = r.date.split("-").map(Number);
    return y === currentYear && m === currentMonth;
  });
  const presentCount = monthRecords.filter((r) => {
    const s =
      typeof r.status === "object"
        ? Object.keys(r.status)[0]
        : String(r.status);
    return s === "present";
  }).length;
  const absentCount = monthRecords.filter((r) => {
    const s =
      typeof r.status === "object"
        ? Object.keys(r.status)[0]
        : String(r.status);
    return s === "absent";
  }).length;
  const leaveCount = monthRecords.filter((r) => {
    const s =
      typeof r.status === "object"
        ? Object.keys(r.status)[0]
        : String(r.status);
    return s === "leave";
  }).length;

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1F2937",
          marginBottom: 6,
        }}
      >
        Welcome, {user?.name || "Worker"}
      </h2>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
        {new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Today's Status */}
      <div style={cardStyle}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 12,
          }}
        >
          {t(language, "todayStatus")}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: statusDisplay.bg,
            borderRadius: 8,
          }}
        >
          <span style={{ color: statusDisplay.color }}>
            {statusDisplay.icon}
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: statusDisplay.color,
            }}
          >
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {/* Monthly Stats */}
      <div style={cardStyle}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 14,
          }}
        >
          {t(language, "thisMonth")}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {[
            {
              label: t(language, "present"),
              value: presentCount,
              color: "#166534",
              bg: "#F0FDF4",
            },
            {
              label: t(language, "absent"),
              value: absentCount,
              color: "#991B1B",
              bg: "#FEF2F2",
            },
            {
              label: t(language, "onLeave"),
              value: leaveCount,
              color: "#92400E",
              bg: "#FFF7ED",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: stat.bg,
                borderRadius: 8,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: stat.color, marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2PM Confirmation */}
      <div style={cardStyle}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#1F2937",
            marginBottom: 8,
          }}
        >
          {t(language, "confirmations2pm")}
        </h3>
        {confirmation ? (
          <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>
            ✓ Confirmed. You resumed work after lunch.
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            {isAfter2PM()
              ? "Please confirm you resumed work after lunch."
              : "Confirmation available at 2:00 PM."}
          </p>
        )}
      </div>

      {/* Holiday Policy */}
      <div
        style={{
          ...cardStyle,
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1E40AF",
            marginBottom: 6,
          }}
        >
          Leave Policy
        </h3>
        <p style={{ fontSize: 13, color: "#3B82F6", margin: 0 }}>
          {t(language, "companyHolidayNotice")}
        </p>
      </div>

      {/* 2PM Popup */}
      <TwoPMConfirmationPopup />
    </div>
  );
}
