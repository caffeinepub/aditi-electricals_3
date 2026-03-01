import React from 'react';
import { useGetAllWorkers, useGetConfirmationsByDate, useGetAllSalaryRecords } from '../../hooks/useQueries';
import { useActor } from '../../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import { AttendanceRecord, Worker } from '../../backend';
import { getTodayDateString, getCurrentMonthYear } from '../../utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserX, CheckCircle2 } from 'lucide-react';

function useTodayAttendance(workers: Worker[]) {
  const { actor, isFetching } = useActor();
  const today = getTodayDateString();
  return useQuery<AttendanceRecord[]>({
    queryKey: ['today-attendance', today],
    queryFn: async () => {
      if (!actor || !workers.length) return [];
      const results = await Promise.all(
        workers.map(w => actor.getAttendanceByDate(w.workerId, today).catch(() => null))
      );
      return results.filter(Boolean) as AttendanceRecord[];
    },
    enabled: !!actor && !isFetching && workers.length > 0,
    refetchInterval: 30000,
  });
}

export default function OwnerDashboard({ onNavigate }: { onNavigate: (page: string, params?: { workerId?: string }) => void }) {
  const today = getTodayDateString();
  const { month, year } = getCurrentMonthYear();

  const { data: workers = [], isLoading: workersLoading } = useGetAllWorkers();
  const { data: todayAttendance = [], isLoading: attLoading } = useTodayAttendance(workers);
  const { data: confirmations = [] } = useGetConfirmationsByDate(today);
  const { data: salaryRecords = [] } = useGetAllSalaryRecords();

  const activeWorkers = workers.filter(w => w.active);

  const presentIds = new Set(
    todayAttendance.filter(r => (r.status as unknown as string) === 'present').map(r => r.workerId)
  );
  const absentWorkers = activeWorkers.filter(w => !presentIds.has(w.workerId));
  const presentWorkers = activeWorkers.filter(w => presentIds.has(w.workerId));

  const currentMonthSalaries = salaryRecords.filter(
    s => Number(s.month) === month && Number(s.year) === year
  );

  const isLoading = workersLoading || attLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Owner Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-sm px-3 py-1">
          <Users className="w-3.5 h-3.5 mr-1.5" />
          {activeWorkers.length} Active Workers
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Workers', value: activeWorkers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Present Today', value: presentWorkers.length, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Absent Today', value: absentWorkers.length, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '2PM Confirmed', value: confirmations.filter(c => c.confirmed).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(stat => (
          <Card key={stat.label} className="shadow-card border-0">
            <CardContent className="p-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-800">{isLoading ? '—' : stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Present List */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              Present Today ({presentWorkers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : presentWorkers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No workers present yet</p>
            ) : (
              <div className="space-y-2">
                {presentWorkers.map(w => (
                  <button
                    key={w.workerId}
                    onClick={() => onNavigate('workerDetail', { workerId: w.workerId })}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{w.name}</span>
                    <Badge className="ml-auto bg-green-100 text-green-700 border-green-200 text-xs">Present</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Absent List */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="w-4 h-4 text-red-500" />
              Not Marked Today ({absentWorkers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : absentWorkers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">All workers have marked attendance</p>
            ) : (
              <div className="space-y-2">
                {absentWorkers.map(w => (
                  <button
                    key={w.workerId}
                    onClick={() => onNavigate('workerDetail', { workerId: w.workerId })}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm flex-shrink-0">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{w.name}</span>
                    <Badge className="ml-auto bg-red-100 text-red-700 border-red-200 text-xs">Not Marked</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Salary Summary */}
      <Card className="shadow-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Salary Records — {new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMonthSalaries.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No salary records for this month</p>
          ) : (
            <div className="space-y-2">
              {currentMonthSalaries.map(s => (
                <div key={s.salaryId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{s.workerId}</span>
                  <span className="text-sm font-bold text-gray-800">₹{Number(s.netPay).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
