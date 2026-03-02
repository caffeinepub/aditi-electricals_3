import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetAttendanceByWorker, useMarkAttendance } from '../../hooks/useQueries';
import { AttendanceStatus, ExternalBlob } from '../../backend';
import { getTodayString, formatDate, isWithinAttendanceWindow } from '../../utils/dateUtils';
import { useCamera } from '../../camera/useCamera';

export default function WorkerAttendance() {
  const { user } = useAuth();
  const workerId = user?.workerId ?? '';
  const today = getTodayString();

  const { data: attendanceRecords = [], isLoading } = useGetAttendanceByWorker(workerId);
  const markAttendanceMutation = useMarkAttendance();

  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'denied' | 'error'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [markingStep, setMarkingStep] = useState<'idle' | 'photo' | 'confirming'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isActive,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'environment', quality: 0.8 });

  const todayRecord = attendanceRecords.find((r) => r.date === today);
  const canMark = isWithinAttendanceWindow() && !todayRecord;

  const getGPS = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      setGpsStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          setGpsStatus('success');
          resolve(c);
        },
        () => {
          setGpsStatus('denied');
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const handleStartMarkAttendance = async () => {
    setMarkingStep('photo');
    setShowCamera(false);
    setCapturedPhoto(null);
    setPhotoPreviewUrl(null);
    setCoords(null);
    setGpsStatus('idle');
    // Start GPS in background
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
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrl(url);
      setShowCamera(false);
      await stopCamera();
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedPhoto(file);
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrl(url);
      setShowCamera(false);
    }
  };

  const handleConfirmAttendance = async () => {
    setMarkingStep('confirming');
    try {
      let photoBlob: ExternalBlob | null = null;
      if (capturedPhoto) {
        const bytes = new Uint8Array(await capturedPhoto.arrayBuffer());
        photoBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress(pct);
        });
      }

      // Wait for GPS if still loading
      let finalCoords = coords;
      if (gpsStatus === 'loading') {
        finalCoords = await getGPS();
      }

      await markAttendanceMutation.mutateAsync({
        workerId,
        status: AttendanceStatus.present,
        latitude: finalCoords?.lat ?? null,
        longitude: finalCoords?.lng ?? null,
        photo: photoBlob,
      });

      setMarkingStep('idle');
      setCapturedPhoto(null);
      setPhotoPreviewUrl(null);
      setCoords(null);
      setGpsStatus('idle');
      setUploadProgress(0);
    } catch (err: any) {
      setMarkingStep('idle');
      alert(err?.message || 'Failed to mark attendance.');
    }
  };

  const handleCancelMark = async () => {
    setMarkingStep('idle');
    setShowCamera(false);
    setCapturedPhoto(null);
    setPhotoPreviewUrl(null);
    setCoords(null);
    setGpsStatus('idle');
    if (isActive) await stopCamera();
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    marginBottom: '16px',
  };

  const btnPrimary: React.CSSProperties = {
    backgroundColor: '#0EA5E9',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const btnSecondary: React.CSSProperties = {
    backgroundColor: '#fff',
    color: '#444',
    border: '1px solid #CFCFCF',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', marginBottom: '20px' }}>
        My Attendance
      </h2>

      {/* Today's Status */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0' }}>
          Today — {formatDate(today)}
        </h3>

        {isLoading ? (
          <p style={{ color: '#888', fontSize: '14px' }}>Loading...</p>
        ) : todayRecord ? (
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '6px',
                padding: '8px 14px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '16px' }}>✅</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#16A34A' }}>
                Attendance Marked
              </span>
            </div>
            {todayRecord.photo && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={todayRecord.photo.getDirectURL()}
                  alt="Attendance photo"
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                  }}
                />
              </div>
            )}
          </div>
        ) : markingStep === 'idle' ? (
          <div>
            {canMark ? (
              <button onClick={handleStartMarkAttendance} style={btnPrimary}>
                Mark Attendance
              </button>
            ) : (
              <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
                {isWithinAttendanceWindow()
                  ? 'Attendance already marked.'
                  : 'Attendance window is closed for today.'}
              </p>
            )}
          </div>
        ) : markingStep === 'photo' ? (
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
              Step 1: Take or select a photo (optional)
            </p>

            {/* GPS status */}
            <div style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
              {gpsStatus === 'loading' && '📍 Getting your location...'}
              {gpsStatus === 'success' && `📍 Location captured (${coords?.lat.toFixed(4)}, ${coords?.lng.toFixed(4)})`}
              {gpsStatus === 'denied' && '📍 Location not available (attendance will still be marked)'}
              {gpsStatus === 'idle' && '📍 Requesting location...'}
            </div>

            {/* Camera preview */}
            {showCamera && (
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '4/3',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    minHeight: '200px',
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {cameraLoading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        fontSize: '14px',
                      }}
                    >
                      Starting camera...
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {cameraError && (
                  <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px' }}>
                    Camera error: {cameraError.message}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={handleCapturePhoto}
                    disabled={!isActive || cameraLoading}
                    style={{
                      ...btnPrimary,
                      opacity: !isActive || cameraLoading ? 0.5 : 1,
                      cursor: !isActive || cameraLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    📸 Capture
                  </button>
                  <button
                    onClick={async () => { setShowCamera(false); await stopCamera(); }}
                    style={btnSecondary}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Photo preview */}
            {photoPreviewUrl && !showCamera && (
              <div style={{ marginBottom: '12px' }}>
                <img
                  src={photoPreviewUrl}
                  alt="Preview"
                  style={{
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <button
                  onClick={() => { setCapturedPhoto(null); setPhotoPreviewUrl(null); }}
                  style={{ ...btnSecondary, marginLeft: '10px', padding: '6px 12px', fontSize: '12px' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Photo action buttons */}
            {!showCamera && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button onClick={handleOpenCamera} style={btnSecondary}>
                  📷 Open Camera
                </button>
                <button onClick={() => fileInputRef.current?.click()} style={btnSecondary}>
                  🖼️ Choose from Gallery
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleGallerySelect}
                />
              </div>
            )}

            {/* Confirm / Cancel */}
            {!showCamera && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleConfirmAttendance} style={btnPrimary}>
                  ✅ Confirm Attendance
                </button>
                <button onClick={handleCancelMark} style={btnSecondary}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : markingStep === 'confirming' ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ fontSize: '14px', color: '#666' }}>
              {uploadProgress > 0 && uploadProgress < 100
                ? `Uploading photo... ${uploadProgress}%`
                : 'Marking attendance...'}
            </p>
          </div>
        ) : null}
      </div>

      {/* Attendance History */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0' }}>
          Recent Attendance
        </h3>
        {isLoading ? (
          <p style={{ color: '#888', fontSize: '14px' }}>Loading...</p>
        ) : attendanceRecords.length === 0 ? (
          <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>No attendance records yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...attendanceRecords]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 10)
              .map((record) => {
                const statusColor =
                  record.status === AttendanceStatus.present
                    ? '#16A34A'
                    : record.status === AttendanceStatus.absent
                    ? '#DC2626'
                    : record.status === AttendanceStatus.leave
                    ? '#D97706'
                    : '#6B7280';
                const statusBg =
                  record.status === AttendanceStatus.present
                    ? '#F0FDF4'
                    : record.status === AttendanceStatus.absent
                    ? '#FEF2F2'
                    : record.status === AttendanceStatus.leave
                    ? '#FFFBEB'
                    : '#F9FAFB';
                const statusBorder =
                  record.status === AttendanceStatus.present
                    ? '#BBF7D0'
                    : record.status === AttendanceStatus.absent
                    ? '#FECACA'
                    : record.status === AttendanceStatus.leave
                    ? '#FDE68A'
                    : '#E5E7EB';

                return (
                  <div
                    key={record.recordId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: statusBg,
                      borderRadius: '6px',
                      border: `1px solid ${statusBorder}`,
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#1a1a1a' }}>
                      {formatDate(record.date)}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: statusColor }}>
                      {String(record.status).charAt(0).toUpperCase() + String(record.status).slice(1)}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
