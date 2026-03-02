import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGetAttendanceByDate, useGetMyConfirmation } from '../../hooks/useQueries';
import { getTodayString, isAfter2PM } from '../../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceStatus } from '../../backend';
import TwoPMConfirmationPopup from '../../components/worker/TwoPMConfirmationPopup';
import { CalendarCheck, Clock, User } from 'lucide-react';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const workerId = user?.workerId || '';
  const today = getTodayString();

  const { data: todayRecord } = useGetAttendanceByDate(workerId, today);
  const { data: confirmation } = useGetMyConfirmation(workerId, today);

  const todayStatus = todayRecord ? (todayRecord.status as unknown as string) : null;
  const isConfirmed = confirmation?.confirmed || false;
  const showConfirmation = isAfter2PM() && !isConfirmed && !!workerId;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome, {user?.name}!</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-shadow border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              todayStatus === 'present' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <CalendarCheck className={`w-6 h-6 ${todayStatus === 'present' ? 'text-green-700' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Attendance</p>
              <p className={`text-lg font-bold capitalize ${
                todayStatus === 'present' ? 'text-green-700' :
                todayStatus === 'absent' ? 'text-red-700' :
                todayStatus === 'leave' ? 'text-yellow-600' : 'text-muted-foreground'
              }`}>
                {todayStatus ? todayStatus : 'Not Marked'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isConfirmed ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <Clock className={`w-6 h-6 ${isConfirmed ? 'text-green-700' : 'text-orange-500'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">2PM Confirmation</p>
              <p className={`text-lg font-bold ${isConfirmed ? 'text-green-700' : 'text-orange-500'}`}>
                {isConfirmed ? 'Confirmed ✓' : 'Pending'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Worker Info */}
      <Card className="card-shadow border-0">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5" /> My Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-muted-foreground">Employee ID</span>
            <span className="font-medium">{user?.id}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Today's Date</span>
            <span className="font-medium">{today}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2PM Popup */}
      {showConfirmation && <TwoPMConfirmationPopup />}
    </div>
  );
}
