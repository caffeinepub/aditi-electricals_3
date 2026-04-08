import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ExternalLink,
  FileText,
  IndianRupee,
  MapPin,
  Phone,
} from "lucide-react";
import React, { useState } from "react";
import AttendanceCalendar from "../../components/AttendanceCalendar";
import NoteCard from "../../components/notes/NoteCard";
import { useGetAllNotes, useGetWorker } from "../../hooks/useQueries";
import {
  useGetAllHolidays,
  useOwnerGetAttendanceByWorkerForMonth,
} from "../../hooks/useQueries";
import { type AttendanceRecord, AttendanceStatus } from "../../types/appTypes";
import { getCurrentMonthYear, getMonthName } from "../../utils/dateUtils";
import SalaryWorkerView from "./SalaryWorkerView";

interface WorkerDetailProps {
  workerId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

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

export default function WorkerDetail({
  workerId,
  onNavigate,
}: WorkerDetailProps) {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  const { data: worker, isLoading: workerLoading } = useGetWorker(workerId);
  const { data: allRecords = [] } = useOwnerGetAttendanceByWorkerForMonth(
    workerId,
    month,
    year,
  );
  const { data: holidays = [] } = useGetAllHolidays();
  const { data: allNotes = [] } = useGetAllNotes();

  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null,
  );

  const workerNotes = allNotes.filter((n) => n.workerId === workerId);

  const presentCount = allRecords.filter((r) => {
    const s =
      typeof r.status === "object"
        ? Object.keys(r.status)[0]
        : String(r.status);
    return s === "present";
  }).length;
  const absentCount = allRecords.filter((r) => {
    const s =
      typeof r.status === "object"
        ? Object.keys(r.status)[0]
        : String(r.status);
    return s === "absent";
  }).length;
  const leaveCount = allRecords.filter((r) => {
    const s =
      typeof r.status === "object"
        ? Object.keys(r.status)[0]
        : String(r.status);
    return s === "leave";
  }).length;

  const handleDateClick = (date: string, record: AttendanceRecord | null) => {
    setSelectedDate(date);
    setSelectedRecord(record);
    setDateDialogOpen(true);
  };

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

  if (workerLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid #BFDBFE",
            borderTopColor: "#3B82F6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  if (!worker) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ color: "#6B7280" }}>Worker not found.</p>
        <button
          type="button"
          onClick={() => onNavigate("workers")}
          style={{
            marginTop: 16,
            padding: "10px 20px",
            background: "#3B82F6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Back to Workers
        </button>
      </div>
    );
  }

  const statusStr = selectedRecord
    ? typeof selectedRecord.status === "object"
      ? Object.keys(selectedRecord.status)[0]
      : String(selectedRecord.status)
    : null;

  const recordTime = selectedRecord
    ? new Date(Number(selectedRecord.timestamp) / 1_000_000).toLocaleTimeString(
        "en-IN",
        { hour: "2-digit", minute: "2-digit" },
      )
    : null;

  const hasLocation =
    selectedRecord &&
    selectedRecord.latitude != null &&
    selectedRecord.longitude != null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("workers")}
          className="h-9 w-9"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "#3B82F6",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {worker.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1F2937",
                margin: 0,
              }}
            >
              {worker.name}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 4,
                flexWrap: "wrap",
              }}
            >
              {worker.mobile && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  <Phone size={12} />
                  {worker.mobile}
                </span>
              )}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                <IndianRupee size={12} />₹
                {Number(worker.monthlySalary).toLocaleString("en-IN")}/month
              </span>
              <span
                style={{
                  background: worker.active ? "#DCFCE7" : "#F3F4F6",
                  color: worker.active ? "#166534" : "#6B7280",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {worker.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Present",
            value: presentCount,
            color: "#166534",
            bg: "#F0FDF4",
          },
          {
            label: "Absent",
            value: absentCount,
            color: "#991B1B",
            bg: "#FEF2F2",
          },
          {
            label: "Leave",
            value: leaveCount,
            color: "#92400E",
            bg: "#FFF7ED",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="attendance">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="attendance" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="salary" className="gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4">
          {/* Month Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
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
          <AttendanceCalendar
            workerId={workerId}
            month={month}
            year={year}
            attendanceRecords={allRecords}
            holidays={holidays}
            onDateClick={handleDateClick}
            isOwner={true}
          />
          <p
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Click a date to view details.
          </p>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <SalaryWorkerView workerId={workerId} workerName={worker.name} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          {workerNotes.length === 0 ? (
            <p
              style={{
                color: "#6B7280",
                fontSize: 14,
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              No notes for this worker
            </p>
          ) : (
            <div className="space-y-3">
              {workerNotes.map((note) => (
                <NoteCard
                  key={note.noteId}
                  note={note}
                  workerName={worker.name}
                  isOwner={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Date detail dialog */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Attendance — {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedRecord ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>
                    Status:
                  </span>
                  <span
                    style={{
                      background:
                        statusStr === "present"
                          ? "#166534"
                          : statusStr === "absent"
                            ? "#991B1B"
                            : statusStr === "leave"
                              ? "#92400E"
                              : "#4B5563",
                      color: "#fff",
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {statusStr}
                  </span>
                </div>
                {recordTime && (
                  <div style={{ fontSize: 13, color: "#6B7280" }}>
                    Time:{" "}
                    <strong style={{ color: "#1F2937" }}>{recordTime}</strong>
                  </div>
                )}
                {hasLocation && selectedRecord && (
                  <LocationPreview
                    latitude={selectedRecord.latitude as number}
                    longitude={selectedRecord.longitude as number}
                  />
                )}
                {selectedRecord.photo && (
                  <div
                    style={{
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <img
                      src={selectedRecord.photo.getDirectURL()}
                      alt="Worker attendance"
                      style={{
                        width: "100%",
                        maxHeight: 180,
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "#9CA3AF", fontSize: 14 }}>
                No attendance record for this date.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
