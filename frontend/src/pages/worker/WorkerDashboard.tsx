import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetWorker, useGetAttendanceByDate, useGetMyConfirmation, useGetAllAnnouncements } from '../../hooks/useQueries';
import { getTodayDateString, isWithinAttendanceWindow, isAfter2PM } from '../../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, IndianRupee, FileText, CheckCircle2, Clock, Megaphone } from 'lucide-react';

interface WorkerDashboardProps {
  onNavigate: (page: string) => void;
}

export default function WorkerDashboard({ onNavigate }: WorkerDashboardProps) {
  const { user } = useAuth();
  const workerId = user?.workerId || '';
  const today = getTodayDateString();

  const { data: worker, isLoading: workerLoading } = useGetWorker(workerId);
  const { data: todayAttendance } = useGetAttendanceByDate(workerId, today);
  const { data: confirmation } = useGetMyConfirmation(workerId, today);
  const { data: announcements = [] } = useGetAllAnnouncements();

  const [inWindow, setInWindow] = useState(isWithinAttendanceWindow());
  const [after2PM, setAfter2PM] = useState(isAfter2PM());

  useEffect(() => {
    const interval = setInterval(() => {
      setInWindow(isWithinAttendanceWindow());
      setAfter2PM(isAfter2PM());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Use worker name from backend, fall back to user name from auth
  const displayName = worker?.name || user?.name || 'Worker';
  const attendanceStatus = todayAttendance ? (todayAttendance.status as unknown as string) : null;

  const latestAnnouncements = announcements.slice(-3).reverse();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-primary rounded-2xl p-6 text-white">
        {workerLoading ? (
          <Skeleton className="h-8 w-48 bg-white/20" />
        ) : (
          <>
            <p className="text-white/70 text-sm font-medium">Welcome back,</p>
            <h1 className="text-3xl font-bold mt-0.5">Hello, {displayName}! 👋</h1>
            <p className="text-white/60 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </>
        )}
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-2 gap-4">
        {/* Attendance Status */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-gray-500">Today's Attendance</span>
            </div>
            {attendanceStatus ? (
              <Badge className={
                attendanceStatus === 'present' ? 'bg-green-100 text-green-700 border-green-200' :
                attendanceStatus === 'absent' ? 'bg-red-100 text-red-700 border-red-200' :
                attendanceStatus === 'leave' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                'bg-gray-100 text-gray-600'
              }>
                {attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1)}
              </Badge>
            ) : inWindow ? (
              <button
                onClick={() => onNavigate('attendance')}
                className="text-sm font-semibold text-primary hover:opacity-80"
              >
                Mark Now →
              </button>
            ) : (
              <span className="text-xs text-gray-400">Not marked</span>
            )}
          </CardContent>
        </Card>

        {/* 2PM Status */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-500">2PM Check-In</span>
            </div>
            {confirmation?.confirmed ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />Confirmed
              </Badge>
            ) : after2PM ? (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                Pending
              </Badge>
            ) : (
              <span className="text-xs text-gray-400">After 2 PM</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Attendance', icon: Calendar, page: 'attendance' },
          { label: 'Salary', icon: IndianRupee, page: 'salary' },
          { label: 'Notes', icon: FileText, page: 'notes' },
        ].map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow border border-gray-100"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Announcements */}
      {latestAnnouncements.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestAnnouncements.map(ann => (
              <div key={ann.announcementId} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-semibold text-blue-800">{ann.title}</p>
                <p className="text-xs text-blue-600 mt-0.5">{ann.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
