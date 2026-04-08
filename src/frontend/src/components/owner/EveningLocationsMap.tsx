import React, { useState } from "react";
import type { EveningLocation } from "../../hooks/useQueries";
import type { Worker } from "../../types/appTypes";

interface EveningWithWorker {
  location: EveningLocation;
  worker: Worker | undefined;
}

interface EveningLocationsMapProps {
  locations: EveningLocation[];
  workers: Worker[];
  date: string;
}

export default function EveningLocationsMap({
  locations,
  workers,
  date,
}: EveningLocationsMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const enriched: EveningWithWorker[] = locations.map((loc) => ({
    location: loc,
    worker: workers.find((w) => w.workerId === loc.workerId),
  }));

  const validRecords = enriched.filter(
    (d) => d.location.latitude != null && d.location.longitude != null,
  );

  // Map center
  const center = React.useMemo(() => {
    if (validRecords.length === 0) return { lat: 20.5937, lng: 78.9629 };
    const avgLat =
      validRecords.reduce((sum, d) => sum + d.location.latitude, 0) /
      validRecords.length;
    const avgLng =
      validRecords.reduce((sum, d) => sum + d.location.longitude, 0) /
      validRecords.length;
    return { lat: avgLat, lng: avgLng };
  }, [validRecords]);

  const buildMapUrl = () =>
    `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}&layer=mapnik`;

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        day: "2-digit",
        month: "short",
      });
    } catch {
      return iso;
    }
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
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌆</div>
        <p style={{ margin: 0, fontSize: "14px" }}>
          No evening GPS data available for {date}.
        </p>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#aaa" }}>
          Workers' 4:00 PM location will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Map */}
      <div
        style={{
          position: "relative",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          height: "300px",
          marginBottom: 16,
        }}
      >
        <iframe
          title="Evening Location Map"
          src={buildMapUrl()}
          style={{ width: "100%", height: "100%", border: "none" }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Worker cards */}
      <p
        style={{
          fontSize: "13px",
          color: "#666",
          marginBottom: "10px",
          fontWeight: 600,
        }}
      >
        Evening locations ({validRecords.length} worker
        {validRecords.length !== 1 ? "s" : ""}):
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {validRecords.map(({ location, worker }) => (
          <button
            type="button"
            key={location.id}
            onClick={() =>
              setSelectedId(selectedId === location.id ? null : location.id)
            }
            style={{
              backgroundColor: selectedId === location.id ? "#EFF6FF" : "#fff",
              border: `1px solid ${
                selectedId === location.id ? "#BAE6FD" : "#e5e7eb"
              }`,
              borderRadius: "8px",
              padding: "12px 16px",
              cursor: "pointer",
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
                <span style={{ fontSize: "18px" }}>🌆</span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "14px",
                      color: "#1a1a1a",
                    }}
                  >
                    {worker?.name || location.workerId}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    {formatTime(location.capturedAt)}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "11px", color: "#888" }}>
                  {location.latitude.toFixed(5)},{" "}
                  {location.longitude.toFixed(5)}
                </p>
                <a
                  href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
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

            {selectedId === location.id && (
              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #BAE6FD",
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "13px",
                    color: "#444",
                  }}
                >
                  <strong>Worker ID:</strong> {location.workerId}
                </p>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "13px",
                    color: "#444",
                  }}
                >
                  <strong>Captured At:</strong>{" "}
                  {formatTime(location.capturedAt)}
                </p>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "13px",
                    color: "#444",
                  }}
                >
                  <strong>Latitude:</strong> {location.latitude.toFixed(6)}
                </p>
                <p style={{ margin: "0", fontSize: "13px", color: "#444" }}>
                  <strong>Longitude:</strong> {location.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
