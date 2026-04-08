import React, { useMemo } from "react";
import {
  type AttendanceRecord,
  type AttendanceRecordPublic,
  AttendanceStatus,
  type Holiday,
} from "../types/appTypes";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
} from "../utils/dateUtils";

interface AttendanceCalendarProps {
  workerId: string;
  month: number;
  year: number;
  attendanceRecords: (AttendanceRecord | AttendanceRecordPublic)[];
  holidays?: Holiday[];
  onDateClick?: (
    date: string,
    record: AttendanceRecord | AttendanceRecordPublic | null,
  ) => void;
  isOwner?: boolean;
}

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  present: { bg: "#166534", text: "#fff", label: "Present" },
  absent: { bg: "#991B1B", text: "#fff", label: "Absent" },
  leave: { bg: "#92400E", text: "#fff", label: "Leave" },
  holiday: { bg: "#4B5563", text: "#fff", label: "Holiday" },
};

export default function AttendanceCalendar({
  workerId: _workerId,
  month,
  year,
  attendanceRecords,
  holidays = [],
  onDateClick,
  isOwner: _isOwner,
}: AttendanceCalendarProps) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const recordMap = useMemo(() => {
    const map: Record<string, AttendanceRecord | AttendanceRecordPublic> = {};
    for (const r of attendanceRecords) {
      map[r.date] = r;
    }
    return map;
  }, [attendanceRecords]);

  const holidaySet = useMemo(() => {
    const set = new Set<string>();
    for (const h of holidays) {
      set.add(h.date);
    }
    return set;
  }, [holidays]);

  const days: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstDay; i++)
    days.push({ day: null, key: `empty-${year}-${month}-${i}` });
  for (let d = 1; d <= daysInMonth; d++)
    days.push({ day: d, key: `day-${year}-${month}-${d}` });

  const getDateStr = (day: number) => {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const getStatusForDay = (day: number) => {
    const dateStr = getDateStr(day);
    if (holidaySet.has(dateStr)) return "holiday";
    const record = recordMap[dateStr];
    if (!record) return null;
    const s = record.status;
    if (typeof s === "object") {
      if ("present" in s) return "present";
      if ("absent" in s) return "absent";
      if ("leave" in s) return "leave";
      if ("holiday" in s) return "holiday";
    }
    return String(s) as string;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        padding: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 8,
        }}
      >
        {weekDays.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "#6B7280",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {days.map(({ day, key }) => {
          if (!day) return <div key={key} aria-hidden="true" />;
          const status = getStatusForDay(day);
          const dateStr = getDateStr(day);
          const record = recordMap[dateStr] || null;
          const colors = status ? STATUS_COLORS[status] : null;

          return (
            <button
              type="button"
              key={key}
              onClick={() => onDateClick?.(dateStr, record)}
              style={{
                aspectRatio: "1",
                borderRadius: 6,
                border: "none",
                background: colors ? colors.bg : "#F9FAFB",
                color: colors ? colors.text : "#374151",
                fontSize: 12,
                fontWeight: colors ? 600 : 400,
                cursor: onDateClick ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.1s",
              }}
              title={status ? STATUS_COLORS[status]?.label : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid #E5E7EB",
        }}
      >
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: val.bg,
              }}
            />
            <span style={{ fontSize: 11, color: "#6B7280" }}>{val.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
