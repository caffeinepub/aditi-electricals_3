import React, { useState } from 'react';
import {
  useGetWorker,
  useGetAttendanceByWorker,
  useGetAllNotes,
} from '../../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Phone, IndianRupee, Calendar, FileText, DollarSign } from 'lucide-react';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import SalaryManagement from './SalaryManagement';
import NoteCard from '../../components/notes/NoteCard';
import { getMonthName, getCurrentMonthYear } from '../../utils/dateUtils';

interface WorkerDetailProps {
  workerId: string;
  onNavigate: (page: string, params?: { workerId?: string }) => void;
}

export default function WorkerDetail({ workerId, onNavigate }: WorkerDetailProps) {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  const { data: worker, isLoading: workerLoading } = useGetWorker(workerId);
  const { data: allRecords = [] } = useGetAttendanceByWorker(workerId);
  const { data: allNotes = [] } = useGetAllNotes();

  const monthRecords = allRecords.filter(r => {
    const [y, m] = r.date.split('-').map(Number);
    return y === year && m === month;
  });

  const workerNotes = allNotes.filter(n => n.workerId === workerId);

  const presentCount = allRecords.filter(r => (r.status as unknown as string) === 'present').length;
  const absentCount = allRecords.filter(r => (r.status as unknown as string) === 'absent').length;
  const leaveCount = allRecords.filter(r => (r.status as unknown as string) === 'leave').length;

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  if (workerLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Worker not found.</p>
        <Button onClick={() => onNavigate('workers')} className="mt-4">Back to Workers</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('workers')} className="h-9 w-9">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {worker.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{worker.name}</h1>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {worker.mobile && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="w-3 h-3" />{worker.mobile}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <IndianRupee className="w-3 h-3" />₹{Number(worker.monthlySalary).toLocaleString('en-IN')}/month
                </span>
                <Badge className={worker.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}>
                  {worker.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Present', value: presentCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Absent', value: absentCount, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Leave', value: leaveCount, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <Card key={stat.label} className="shadow-card border-0">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="attendance">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="attendance" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5" />Attendance
          </TabsTrigger>
          <TabsTrigger value="salary" className="gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />Salary
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{getMonthName(month)} {year}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <AttendanceCalendar
            month={month}
            year={year}
            records={monthRecords}
            isOwner={false}
          />
          <p className="text-xs text-gray-400 text-center">
            Go to Attendance Management to edit records
          </p>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <SalaryManagement preselectedWorkerId={workerId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          {workerNotes.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No notes for this worker</p>
          ) : (
            <div className="space-y-3">
              {workerNotes.map(note => (
                <NoteCard key={note.noteId} note={note} workerName={worker.name} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
