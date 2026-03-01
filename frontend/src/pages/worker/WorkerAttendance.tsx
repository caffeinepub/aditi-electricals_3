import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetAttendanceByWorker, useGetAttendanceByDate, useMarkAttendance } from '../../hooks/useQueries';
import { AttendanceStatus } from '../../backend';
import { getTodayDateString, isWithinAttendanceWindow, getMonthName, getCurrentMonthYear } from '../../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import AttendanceCalendar from '../../components/AttendanceCalendar';

export default function WorkerAttendance() {
  const { user } = useAuth();
  const workerId = user?.workerId || '';
  const today = getTodayDateString();
  const { month: curMonth, year: curYear } = getCurrentMonthYear();

  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [inWindow, setInWindow] = useState(isWithinAttendanceWindow());
  const [markError, setMarkError] = useState('');
  const [markSuccess, setMarkSuccess] = useState(false);

  const { data: allRecords = [] } = useGetAttendanceByWorker(workerId);
  const { data: todayRecord, refetch: refetchToday } = useGetAttendanceByDate(workerId, today);
  const markAttendance = useMarkAttendance();

  useEffect(() => {
    const interval = setInterval(() => setInWindow(isWithinAttendanceWindow()), 30000);
    return () => clearInterval(interval);
  }, []);

  const monthRecords = allRecords.filter(r => {
    const [y, m] = r.date.split('-').map(Number);
    return y === year && m === month;
  });

  const presentCount = monthRecords.filter(r => (r.status as unknown as string) === 'present').length;
  const absentCount = monthRecords.filter(r => (r.status as unknown as string) === 'absent').length;
  const leaveCount = monthRecords.filter(r => (r.status as unknown as string) === 'leave').length;

  const handleMarkAttendance = async () => {
    setMarkError('');
    try {
      await markAttendance.mutateAsync({ workerId, status: AttendanceStatus.present });
      setMarkSuccess(true);
      refetchToday();
      setTimeout(() => setMarkSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark attendance.';
      if (msg.includes('already marked')) {
        setMarkError('Attendance already marked for today.');
      } else {
        setMarkError(msg);
      }
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const todayStatus = todayRecord ? (todayRecord.status as unknown as string) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your daily attendance</p>
      </div>

      {/* Today's Attendance Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sky-100 text-sm">Today</p>
              <p className="font-bold text-lg">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            {todayStatus && (
              <Badge className={
                todayStatus === 'present' ? 'bg-green-500 text-white border-0 text-sm px-3 py-1' :
                'bg-red-500 text-white border-0 text-sm px-3 py-1'
              }>
                {todayStatus.charAt(0).toUpperCase() + todayStatus.slice(1)}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          {todayStatus === 'present' ? (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Attendance already marked for today</span>
            </div>
          ) : inWindow ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Clock className="w-4 h-4" />
                <span>Attendance window: 9:00 AM – 9:30 AM (Open now)</span>
              </div>
              <Button
                onClick={handleMarkAttendance}
                disabled={markAttendance.isPending}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-base"
              >
                {markAttendance.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Marking...
                  </span>
                ) : '✓ Mark Attendance'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Attendance window: 9:00 AM – 9:30 AM (Closed)</span>
            </div>
          )}

          {markSuccess && (
            <div className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <CheckCircle className="w-4 h-4" />Attendance marked successfully!
            </div>
          )}
          {markError && (
            <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4" />{markError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Present', value: presentCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Absent', value: absentCount, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Leave', value: leaveCount, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{getMonthName(month)} {year}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar month={month} year={year} records={monthRecords} />
        </CardContent>
      </Card>
    </div>
  );
}
