import React, { useState } from 'react';
import {
  useGetAllWorkers,
  useGetAttendanceByWorker,
  useOwnerAddAttendance,
  useOwnerUpdateAttendance,
  useOwnerDeleteAttendance,
} from '../../hooks/useQueries';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import { AttendanceRecord, AttendanceStatus } from '../../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, Loader2, MapPin, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialWorkerId?: string | null;
}

const STATUS_OPTIONS = [
  { value: AttendanceStatus.present, label: 'Present', cls: 'status-present' },
  { value: AttendanceStatus.absent, label: 'Absent', cls: 'status-absent' },
  { value: AttendanceStatus.leave, label: 'Leave', cls: 'status-leave' },
  { value: AttendanceStatus.holiday, label: 'Holiday', cls: 'status-holiday' },
];

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

export default function AttendanceManagement({ initialWorkerId }: Props) {
  const { data: workers = [] } = useGetAllWorkers();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(initialWorkerId || null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | undefined>();

  const selectedWorker = workers.find(w => w.workerId === selectedWorkerId);
  const { data: records = [] } = useGetAttendanceByWorker(selectedWorkerId || '');

  const addAttendance = useOwnerAddAttendance();
  const updateAttendance = useOwnerUpdateAttendance();
  const deleteAttendance = useOwnerDeleteAttendance();

  const handleDateClick = (date: string, existing?: AttendanceRecord) => {
    setSelectedDate(date);
    setExistingRecord(existing);
    setDialogOpen(true);
  };

  const handleSetStatus = async (status: AttendanceStatus) => {
    if (!selectedWorkerId) return;
    try {
      if (existingRecord) {
        await updateAttendance.mutateAsync({ recordId: existingRecord.recordId, status });
        toast.success('Attendance updated');
      } else {
        await addAttendance.mutateAsync({ workerId: selectedWorkerId, date: selectedDate, status });
        toast.success('Attendance marked');
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update attendance');
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;
    try {
      await deleteAttendance.mutateAsync(existingRecord.recordId);
      toast.success('Attendance deleted');
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

  const isLoading = addAttendance.isPending || updateAttendance.isPending || deleteAttendance.isPending;

  const hasLocation =
    existingRecord &&
    existingRecord.latitude != null &&
    existingRecord.longitude != null;

  if (!selectedWorkerId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">All Attendance</h2>
        <p className="text-muted-foreground text-sm">Select a worker to view and manage their attendance.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map(w => (
            <Card
              key={w.workerId}
              className="card-shadow border-0 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
              onClick={() => setSelectedWorkerId(w.workerId)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--header-bg)] flex items-center justify-center text-white font-bold text-lg">
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{w.name}</p>
                  <p className="text-sm text-muted-foreground">{w.workerId}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {workers.length === 0 && (
            <p className="text-muted-foreground col-span-3 py-8 text-center">No workers found.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setSelectedWorkerId(null)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{selectedWorker?.name}</h2>
          <p className="text-sm text-muted-foreground">{selectedWorkerId} – Click any date to set attendance</p>
        </div>
      </div>

      <AttendanceCalendar
        workerId={selectedWorkerId}
        records={records}
        onDateClick={handleDateClick}
        isOwner={true}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Attendance – {selectedDate}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSetStatus(opt.value)}
                disabled={isLoading}
                className={`py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 ${opt.cls} ${
                  existingRecord && String(existingRecord.status) === String(opt.value) ? 'ring-2 ring-offset-2 ring-primary' : ''
                }`}
              >
                {opt.label}
                {existingRecord && String(existingRecord.status) === String(opt.value) && ' ✓'}
              </button>
            ))}
          </div>

          {/* Location preview — only shown when coordinates are present */}
          {hasLocation && (
            <LocationPreview
              latitude={existingRecord!.latitude!}
              longitude={existingRecord!.longitude!}
            />
          )}

          {existingRecord && (
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete Record
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
