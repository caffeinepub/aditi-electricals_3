import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { AttendanceStatus, ExternalBlob } from "../../backend";
import { useCamera } from "../../camera/useCamera";
import AttendanceCalendar from "../../components/AttendanceCalendar";
import { useAuth } from "../../contexts/AuthContext";
import {
  useGetAllHolidays,
  useGetAttendanceByWorker,
  useGetAttendanceByWorkerForMonth,
  useMarkAttendance,
  useSaveEveningLocation,
} from "../../hooks/useQueries";
import {
  formatDate,
  getCurrentMonthYear,
  getMonthName,
  getTodayString,
  isWithinAttendanceWindow,
} from "../../utils/dateUtils";

// Request geolocation permission and return coords, or null if denied/unavailable
function captureGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 12000, enableHighAccuracy: true },
    );
  });
}

// How many minutes until 9:00 AM (returns negative if past)
function minutesUntilNineAM(): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(9, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 60000);
}

function getAttendanceWindowStatus(): "before" | "open" | "closed" {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  if (total < 9 * 60) return "before";
  if (total <= 9 * 60 + 30) return "open";
  return "closed";
}

export default function WorkerAttendance() {
  const { user } = useAuth();
  const workerId = user?.workerId ?? "";
  const today = getTodayString();
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [calMonth, setCalMonth] = useState(curMonth);
  const [calYear, setCalYear] = useState(curYear);

  const { data: allRecords = [], isLoading } =
    useGetAttendanceByWorker(workerId);
  const { data: calendarRecords = [] } = useGetAttendanceByWorkerForMonth(
    workerId,
    calMonth,
    calYear,
  );
  const { data: holidays = [] } = useGetAllHolidays();
  const markAttendanceMutation = useMarkAttendance();
  const saveEveningLocation = useSaveEveningLocation();
  const saveEveningLocationRef = useRef(saveEveningLocation.mutateAsync);
  saveEveningLocationRef.current = saveEveningLocation.mutateAsync;

  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "loading" | "success" | "denied" | "error"
  >("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [markingStep, setMarkingStep] = useState<
    "idle" | "photo" | "confirming"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [windowStatus, setWindowStatus] = useState(getAttendanceWindowStatus);
  const [eveningCaptured, setEveningCaptured] = useState(false);
  const [eveningStatus, setEveningStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-check window status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWindowStatus(getAttendanceWindowStatus());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Schedule 4 PM evening location capture
  useEffect(() => {
    if (!workerId) return;
    const now = new Date();
    const target = new Date(now);
    target.setHours(16, 0, 0, 0);
    // If already past 4PM today, don't schedule
    if (target.getTime() <= now.getTime()) return;
    const msUntil = target.getTime() - now.getTime();
    const timer = setTimeout(async () => {
      // Request permission if not already granted
      if ("geolocation" in navigator) {
        setEveningStatus("Capturing evening location...");
        const loc = await captureGPS();
        if (loc) {
          try {
            await saveEveningLocationRef.current({
              workerId,
              date: getTodayString(),
              latitude: loc.lat,
              longitude: loc.lng,
            });
            setEveningCaptured(true);
            setEveningStatus("Evening location saved ✓");
          } catch {
            setEveningStatus("Evening location save failed.");
          }
        } else {
          setEveningStatus("Evening location: permission denied.");
        }
      }
    }, msUntil);
    return () => clearTimeout(timer);
  }, [workerId]);

  const {
    isActive,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: "environment", quality: 0.8 });

  const todayRecord = allRecords.find((r) => r.date === today);
  // Use derived window status for button enable
  const canMark = windowStatus === "open" && !todayRecord;

  const getGPS = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      setGpsStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          setGpsStatus("success");
          resolve(c);
        },
        () => {
          setGpsStatus("denied");
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true },
      );
    });
  };

  const handleStartMarkAttendance = async () => {
    // Hard block outside window
    const status = getAttendanceWindowStatus();
    if (status !== "open") {
      alert(
        status === "before"
          ? `Attendance window opens at 9:00 AM. Please come back in ${minutesUntilNineAM()} minute(s).`
          : "Attendance window closed at 9:30 AM. You can no longer mark attendance for today.",
      );
      return;
    }
    setMarkingStep("photo");
    setShowCamera(false);
    setCapturedPhoto(null);
    setPhotoPreviewUrl(null);
    setCoords(null);
    setGpsStatus("idle");
    getGPS();
  };

  const handleOpenCamera = async () => {
    setShowCamera(true);
    await startCamera();
  };

  const handleCapturePhoto = async () => {
    const file = await capturePhoto();
    if (file) {
      setCapturedPhoto(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
      setShowCamera(false);
      await stopCamera();
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedPhoto(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
      setShowCamera(false);
    }
  };

  const handleConfirmAttendance = async () => {
    // Hard block outside window at submit time too
    const status = getAttendanceWindowStatus();
    if (status !== "open") {
      setMarkingStep("idle");
      alert(
        "Attendance window is closed. Attendance cannot be marked outside 9:00 AM – 9:30 AM.",
      );
      return;
    }
    setMarkingStep("confirming");
    try {
      let photoBlob: ExternalBlob | null = null;
      if (capturedPhoto) {
        const bytes = new Uint8Array(await capturedPhoto.arrayBuffer());
        photoBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
          setUploadProgress(pct),
        );
      }
      let finalCoords = coords;
      if (gpsStatus === "loading") finalCoords = await getGPS();

      await markAttendanceMutation.mutateAsync({
        workerId,
        status: AttendanceStatus.present,
        latitude: finalCoords?.lat ?? null,
        longitude: finalCoords?.lng ?? null,
        photo: photoBlob,
      });

      setMarkingStep("idle");
      setCapturedPhoto(null);
      setPhotoPreviewUrl(null);
      setCoords(null);
      setGpsStatus("idle");
      setUploadProgress(0);
    } catch (err: unknown) {
      setMarkingStep("idle");
      alert(err instanceof Error ? err.message : "Failed to mark attendance.");
    }
  };

  const handleCancelMark = async () => {
    setMarkingStep("idle");
    setShowCamera(false);
    setCapturedPhoto(null);
    setPhotoPreviewUrl(null);
    setCoords(null);
    setGpsStatus("idle");
    if (isActive) await stopCamera();
  };

  const prevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    marginBottom: 16,
  };

  const btnPrimary: React.CSSProperties = {
    backgroundColor: "#3B82F6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };

  const btnSecondary: React.CSSProperties = {
    backgroundColor: "#fff",
    color: "#374151",
    border: "1.5px solid #D1D5DB",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  };

  const renderWindowBanner = () => {
    if (todayRecord) return null;
    if (windowStatus === "before") {
      const mins = minutesUntilNineAM();
      return (
        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              color: "#1E40AF",
              fontSize: 14,
              margin: 0,
              fontWeight: 500,
            }}
          >
            ⏰ Attendance opens at 9:00 AM
            {mins > 0 ? ` (in ${mins} minute${mins !== 1 ? "s" : ""})` : ""}
          </p>
        </div>
      );
    }
    if (windowStatus === "closed") {
      return (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              color: "#991B1B",
              fontSize: 14,
              margin: 0,
              fontWeight: 500,
            }}
          >
            🔒 Attendance window closed at 9:30 AM.
          </p>
        </div>
      );
    }
    return (
      <div
        style={{
          background: "#F0FDF4",
          border: "1px solid #BBF7D0",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 12,
        }}
      >
        <p
          style={{ color: "#166534", fontSize: 14, margin: 0, fontWeight: 500 }}
        >
          ✅ Attendance window is open (9:00 AM – 9:30 AM)
        </p>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1F2937",
          marginBottom: 20,
        }}
      >
        My Attendance
      </h2>

      {/* Today's Status */}
      <div style={cardStyle}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#1F2937",
            margin: "0 0 12px 0",
          }}
        >
          Today — {formatDate(today)}
        </h3>

        {isLoading ? (
          <p style={{ color: "#9CA3AF", fontSize: 14 }}>Loading...</p>
        ) : todayRecord ? (
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 8,
                padding: "8px 14px",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>
                Attendance Marked
              </span>
            </div>
            {(todayRecord as { photo?: { getDirectURL?: () => string } })
              .photo && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={
                    (
                      todayRecord as { photo?: { getDirectURL?: () => string } }
                    ).photo?.getDirectURL?.() ?? ""
                  }
                  alt="Worker attendance"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                  }}
                />
              </div>
            )}
          </div>
        ) : markingStep === "idle" ? (
          <div>
            {renderWindowBanner()}
            {canMark ? (
              <button
                type="button"
                onClick={handleStartMarkAttendance}
                style={btnPrimary}
              >
                Mark Attendance
              </button>
            ) : windowStatus !== "open" ? null : (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <p
                  style={{
                    color: "#991B1B",
                    fontSize: 14,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  Attendance already marked.
                </p>
              </div>
            )}
          </div>
        ) : markingStep === "photo" ? (
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#1F2937",
                marginBottom: 12,
              }}
            >
              Step 1: Take or select a photo (optional)
            </p>

            <div style={{ marginBottom: 12, fontSize: 13, color: "#6B7280" }}>
              {gpsStatus === "loading" && "📍 Getting your location..."}
              {gpsStatus === "success" && "📍 Location captured"}
              {gpsStatus === "denied" &&
                "📍 Location not available (attendance will still be marked)"}
              {gpsStatus === "idle" && "📍 Requesting location..."}
            </div>

            {showCamera && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "4/3",
                    backgroundColor: "#000",
                    borderRadius: 8,
                    overflow: "hidden",
                    minHeight: 200,
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {cameraLoading && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        fontSize: 14,
                      }}
                    >
                      Starting camera...
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} style={{ display: "none" }} />
                {cameraError && (
                  <p style={{ color: "#EF4444", fontSize: 13, marginTop: 6 }}>
                    Camera error: {cameraError.message}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={!isActive || cameraLoading}
                    style={{
                      ...btnPrimary,
                      opacity: !isActive || cameraLoading ? 0.5 : 1,
                      cursor:
                        !isActive || cameraLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    📸 Capture
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setShowCamera(false);
                      await stopCamera();
                    }}
                    style={btnSecondary}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {photoPreviewUrl && !showCamera && (
              <div style={{ marginBottom: 12 }}>
                <img
                  src={photoPreviewUrl}
                  alt="Preview"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhoto(null);
                    setPhotoPreviewUrl(null);
                  }}
                  style={{
                    ...btnSecondary,
                    marginLeft: 10,
                    padding: "6px 12px",
                    fontSize: 12,
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            {!showCamera && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  style={btnSecondary}
                >
                  📷 Open Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={btnSecondary}
                >
                  🖼️ Choose from Gallery
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleGallerySelect}
                />
              </div>
            )}

            {!showCamera && (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleConfirmAttendance}
                  style={btnPrimary}
                >
                  ✅ Confirm Attendance
                </button>
                <button
                  type="button"
                  onClick={handleCancelMark}
                  style={btnSecondary}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : markingStep === "confirming" ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <p style={{ fontSize: 14, color: "#6B7280" }}>
              {uploadProgress > 0 && uploadProgress < 100
                ? `Uploading photo... ${uploadProgress}%`
                : "Marking attendance..."}
            </p>
          </div>
        ) : null}
      </div>

      {/* Evening location status */}
      {eveningStatus && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              color: eveningCaptured ? "#166534" : "#6B7280",
              margin: 0,
            }}
          >
            🌆 {eveningStatus}
          </p>
        </div>
      )}

      {/* Calendar */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1F2937",
              margin: 0,
            }}
          >
            Attendance Calendar
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={prevMonth}
              style={{
                background: "#F3F4F6",
                border: "none",
                borderRadius: 6,
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                minWidth: 110,
                textAlign: "center",
              }}
            >
              {getMonthName(calMonth)} {calYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              style={{
                background: "#F3F4F6",
                border: "none",
                borderRadius: 6,
                padding: "4px 6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <AttendanceCalendar
          workerId={workerId}
          month={calMonth}
          year={calYear}
          attendanceRecords={calendarRecords}
          holidays={holidays}
          isOwner={false}
        />
      </div>
    </div>
  );
}
