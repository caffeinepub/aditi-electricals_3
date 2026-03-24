import React, { useState, useRef } from "react";
import type { AttendanceRecord, Worker } from "../../backend";
import { formatTimestamp } from "../../utils/dateUtils";

interface AttendanceWithWorker {
  record: AttendanceRecord;
  worker: Worker;
}

interface TodayAttendanceMapProps {
  attendanceData: AttendanceWithWorker[];
}

// Simple interactive map using OpenStreetMap tiles rendered on a canvas-like div
// Uses iframe embed for actual map display with markers overlay
export default function TodayAttendanceMap({
  attendanceData,
}: TodayAttendanceMapProps) {
  const [selectedMarker, setSelectedMarker] =
    useState<AttendanceWithWorker | null>(null);
  const [_mapReady, setMapReady] = useState(false);
  const _mapRef = useRef<HTMLDivElement>(null);

  const validRecords = attendanceData.filter(
    (d) => d.record.latitude != null && d.record.longitude != null,
  );

  // Calculate map center from markers
  const center = React.useMemo(() => {
    if (validRecords.length === 0) return { lat: 20.5937, lng: 78.9629 }; // India center
    const avgLat =
      validRecords.reduce((sum, d) => sum + (d.record.latitude ?? 0), 0) /
      validRecords.length;
    const avgLng =
      validRecords.reduce((sum, d) => sum + (d.record.longitude ?? 0), 0) /
      validRecords.length;
    return { lat: avgLat, lng: avgLng };
  }, [validRecords]);

  const _zoom = validRecords.length > 0 ? 14 : 5;

  // Build OpenStreetMap URL with markers
  const buildMapUrl = () => {
    const baseUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}&layer=mapnik`;
    return baseUrl;
  };

  const formatTime = (timestamp: bigint) => {
    return formatTimestamp(timestamp);
  };

  if (validRecords.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "24px",
          textAlign: "center",
          color: "#888",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📍</div>
        <p style={{ margin: 0, fontSize: "14px" }}>
          No GPS data available for today's attendance.
        </p>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#aaa" }}>
          Workers need to allow location access when marking attendance.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Map iframe */}
      <div
        style={{
          position: "relative",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          height: "400px",
        }}
      >
        <iframe
          title="Today's Attendance Map"
          src={buildMapUrl()}
          style={{ width: "100%", height: "100%", border: "none" }}
          onLoad={() => setMapReady(true)}
        />

        {/* Marker overlay - positioned over the iframe */}
        {/* We show a list of workers with GPS data below the map instead */}
      </div>

      {/* Worker location cards below map */}
      <div style={{ marginTop: "16px" }}>
        <p
          style={{
            fontSize: "13px",
            color: "#666",
            marginBottom: "10px",
            fontWeight: 600,
          }}
        >
          Workers with GPS data ({validRecords.length}):
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {validRecords.map(({ record, worker }) => (
            <button
              type="button"
              key={record.recordId}
              onClick={() =>
                setSelectedMarker(
                  selectedMarker?.record.recordId === record.recordId
                    ? null
                    : { record, worker },
                )
              }
              style={{
                backgroundColor:
                  selectedMarker?.record.recordId === record.recordId
                    ? "#EFF6FF"
                    : "#fff",
                border: `1px solid ${selectedMarker?.record.recordId === record.recordId ? "#BAE6FD" : "#e5e7eb"}`,
                borderRadius: "8px",
                padding: "12px 16px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                width: "100%",
                textAlign: "left",
                display: "block",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontSize: "18px" }}>📍</span>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#1a1a1a",
                      }}
                    >
                      {worker.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0 0",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      {formatTime(record.timestamp)}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>
                    {record.latitude?.toFixed(5)},{" "}
                    {record.longitude?.toFixed(5)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: "11px",
                      color: "#0EA5E9",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Open in Maps ↗
                  </a>
                </div>
              </div>

              {/* Expanded detail */}
              {selectedMarker?.record.recordId === record.recordId && (
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid #BAE6FD",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                    }}
                  >
                    {record.photo && (
                      <img
                        src={record.photo.getDirectURL()}
                        alt={`${worker.name} at work`}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "13px",
                          color: "#444",
                        }}
                      >
                        <strong>Worker ID:</strong> {worker.workerId}
                      </p>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "13px",
                          color: "#444",
                        }}
                      >
                        <strong>Time:</strong> {formatTime(record.timestamp)}
                      </p>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "13px",
                          color: "#444",
                        }}
                      >
                        <strong>Latitude:</strong> {record.latitude?.toFixed(6)}
                      </p>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "13px",
                          color: "#444",
                        }}
                      >
                        <strong>Longitude:</strong>{" "}
                        {record.longitude?.toFixed(6)}
                      </p>
                      {!record.photo && (
                        <p
                          style={{
                            margin: "0",
                            fontSize: "12px",
                            color: "#aaa",
                          }}
                        >
                          No photo available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
