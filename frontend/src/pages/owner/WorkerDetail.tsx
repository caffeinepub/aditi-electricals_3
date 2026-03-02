import React, { useState } from 'react';
import { useGetWorker, useGetAttendanceByWorker, useGetAllNotes } from '../../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, Phone, IndianRupee, Calendar, FileText, DollarSign, MapPin, ExternalLink } from 'lucide-react';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import NoteCard from '../../components/notes/NoteCard';
import { AttendanceRecord, AttendanceStatus } from '../../backend';
import SalaryWorkerView from './SalaryWorkerView';

interface WorkerDetailProps {
  workerId: string;
  onNavigate: (page: string, params?: { workerId?: string }) => void;
}

function LocationPreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.005},${longitude + 0.005},${latitude + 0.005}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-xs font-medium text-gray-600">Location at check-in</span>
      </div>
      <div className="relative" style={{ height: 160 }}>
        <iframe
          src={osmUrl}
          title="Attendance location"
          className="w-full h-full border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}

export default function WorkerDetail({ workerId, onNavigate }: WorkerDetailProps) {
  const { data: worker, isLoading: workerLoading } = useGetWorker(workerId);
  const { data: allRecords = [] } = useGetAttendanceByWorker(workerId);
  const { data: allNotes = [] } = useGetAllNotes();

  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | undefined>();

  const workerNotes = allNotes.filter(n => n.workerId === workerId);

  const presentCount = allRecords.filter(r => r.status === AttendanceStatus.present).length;
  const absentCount = allRecords.filter(r => r.status === AttendanceStatus.absent).length;
  const leaveCount = allRecords.filter(r => r.status === AttendanceStatus.leave).length;

  const handleDateClick = (date: string, existing?: AttendanceRecord) => {
    setSelectedDate(date);
    setSelectedRecord(existing);
    setDateDialogOpen(true);
  };

  if (workerLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Worker not found.</p>
        <Button onClick={() => onNavigate('workers')} className="mt-4">Back to Workers</Button>
      </div>
    );
  }

  const statusLabel = selectedRecord ? String(selectedRecord.status) : null;
  const statusCls = statusLabel === 'present' ? 'status-present' :
    statusLabel === 'absent' ? 'status-absent' :
    statusLabel === 'leave' ? 'status-leave' :
    statusLabel === 'holiday' ? 'status-holiday' : '';

  const recordTime = selectedRecord
    ? new Date(Number(selectedRecord.timestamp) / 1_000_000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const hasLocation =
    selectedRecord &&
    selectedRecord.latitude != null &&
    selectedRecord.longitude != null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('workers')} className="h-9 w-9">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 bg-[var(--header-bg)] rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {worker.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{worker.name}</h1>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {worker.mobile && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />{worker.mobile}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
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
          { label: 'Present', value: presentCount, cls: 'text-green-700' },
          { label: 'Absent', value: absentCount, cls: 'text-red-700' },
          { label: 'Leave', value: leaveCount, cls: 'text-yellow-600' },
        ].map(stat => (
          <Card key={stat.label} className="card-shadow border-0">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.cls}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
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

        <TabsContent value="attendance" className="mt-4">
          <AttendanceCalendar
            workerId={workerId}
            records={allRecords}
            isOwner={true}
            onDateClick={handleDateClick}
          />
          <p className="text-xs text-muted-foreground text-center mt-2">
            Click a date to view details. Go to Attendance Management to edit records.
          </p>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <SalaryWorkerView workerId={workerId} workerName={worker.name} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          {workerNotes.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No notes for this worker</p>
          ) : (
            <div className="space-y-3">
              {workerNotes.map(note => (
                <NoteCard key={note.noteId} note={note} workerName={worker.name} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Date detail dialog — owner only, shows status, time, and location */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Attendance – {selectedDate}</DialogTitle>
          </DialogHeader>

          {selectedRecord ? (
            <div className="space-y-2 py-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusCls}`}>
                  {statusLabel ? statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1) : '—'}
                </span>
              </div>
              {recordTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Marked at</span>
                  <span className="text-sm font-medium">{recordTime}</span>
                </div>
              )}
              {hasLocation && (
                <LocationPreview
                  latitude={selectedRecord!.latitude!}
                  longitude={selectedRecord!.longitude!}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No attendance record for this date.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
