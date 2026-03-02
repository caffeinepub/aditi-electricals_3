import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetAllWorkers, useGetTodayAttendanceAll, useGetConfirmationsByDate } from '../../hooks/useQueries';
import { getTodayString, formatDate } from '../../utils/dateUtils';
import TodayAttendanceMap from '../../components/owner/TodayAttendanceMap';
import { AttendanceStatus, type AttendanceRecord, type Worker } from '../../backend';

interface OwnerDashboardProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export default function OwnerDashboard({ onNavigate }: OwnerDashboardProps) {
  const { user } = useAuth();
  const today = getTodayString();

  const { data: workers = [], isLoading: workersLoading } = useGetAllWorkers();
  // useGetTodayAttendanceAll returns AttendanceRecord[] (flat list of today's records)
  const { data: todayAttendance = [], isLoading: attendanceLoading } = useGetTodayAttendanceAll();
  const { data: confirmations = [], isLoading: confirmationsLoading } = useGetConfirmationsByDate(today);

  const activeWorkers = workers.filter((w) => w.active);

  // Workers who have a present record today
  const presentRecords = todayAttendance.filter(
    (r) => r.status === AttendanceStatus.present
  );

  // Enrich present records with worker info
  const presentWorkers: Array<{ worker: Worker; record: AttendanceRecord }> = presentRecords
    .map((record) => {
      const worker = workers.find((w) => w.workerId === record.workerId);
      return worker ? { worker, record } : null;
    })
    .filter((x): x is { worker: Worker; record: AttendanceRecord } => x !== null);

  // Workers who have NO attendance record today
  const absentWorkers = activeWorkers.filter(
    (w) => !todayAttendance.find((r) => r.workerId === w.workerId)
  );

  const confirmedWorkers = confirmations.filter((c) => c.confirmed);

  // Build attendance data with worker info for map (records that have GPS)
  const attendanceWithWorkers = presentWorkers.filter(
    (d) => d.record.latitude != null && d.record.longitude != null
  );

  const isLoading = workersLoading || attendanceLoading;

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '16px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    textAlign: 'center' as const,
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px 0' }}>
          Owner Dashboard
        </h2>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          {formatDate(today)} — Today's Overview
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</div>
      ) : (
        <>
          {/* Stats Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div style={statCardStyle}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#22C55E', margin: '0 0 4px 0' }}>
                {presentWorkers.length}
              </p>
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Present</p>
            </div>
            <div style={statCardStyle}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#EF4444', margin: '0 0 4px 0' }}>
                {absentWorkers.length}
              </p>
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Absent</p>
            </div>
            <div style={statCardStyle}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#0EA5E9', margin: '0 0 4px 0' }}>
                {activeWorkers.length}
              </p>
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Total Workers</p>
            </div>
          </div>

          {/* Present Workers */}
          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0' }}>
              ✅ Present Today ({presentWorkers.length})
            </h3>
            {presentWorkers.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>No workers marked present yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {presentWorkers.map(({ worker }) => (
                  <div
                    key={worker.workerId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#F0FDF4',
                      borderRadius: '6px',
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                      {worker.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#16A34A' }}>
                      {worker.workerId}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Absent Workers */}
          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0' }}>
              ❌ Absent Today ({absentWorkers.length})
            </h3>
            {absentWorkers.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>All workers are present!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {absentWorkers.map((worker) => (
                  <div
                    key={worker.workerId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#FEF2F2',
                      borderRadius: '6px',
                      border: '1px solid #FECACA',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                      {worker.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#DC2626' }}>
                      {worker.workerId}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2PM Confirmations */}
          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0' }}>
              🕑 2PM Confirmations ({confirmedWorkers.length}/{activeWorkers.length})
            </h3>
            {confirmationsLoading ? (
              <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Loading...</p>
            ) : confirmedWorkers.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>No 2PM confirmations yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {confirmedWorkers.map((conf) => {
                  const worker = workers.find((w) => w.workerId === conf.workerId);
                  return (
                    <div
                      key={conf.confirmationId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#F0F9FF',
                        borderRadius: '6px',
                        border: '1px solid #BAE6FD',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                        {worker?.name ?? conf.workerId}
                      </span>
                      <span style={{ fontSize: '12px', color: '#0284C7' }}>Confirmed ✓</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's Attendance Map - Owner only */}
          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px 0' }}>
              🗺️ Today's Attendance Map
            </h3>
            <TodayAttendanceMap attendanceData={attendanceWithWorkers} />
          </div>

          {/* Quick Actions */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { label: 'Manage Workers', page: 'workers' },
                { label: 'Attendance', page: 'attendance' },
                { label: 'Salary', page: 'salary' },
                { label: 'Holidays', page: 'holidays' },
                { label: 'Notes', page: 'notes' },
              ].map(({ label, page }) => (
                <button
                  key={page}
                  onClick={() => onNavigate(page)}
                  style={{
                    backgroundColor: '#F0F9FF',
                    color: '#0EA5E9',
                    border: '1px solid #BAE6FD',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
