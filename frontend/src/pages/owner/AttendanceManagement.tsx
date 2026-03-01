import React, { useState } from 'react';
import {
  useGetAllWorkers,
  useGetAttendanceByWorker,
  useOwnerAddAttendance,
  useOwnerUpdateAttendance,
  useOwnerDeleteAttendance,
} from '../../hooks/useQueries';
import { AttendanceRecord, AttendanceStatus } from '../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import { getMonthName } from '../../utils/dateUtils';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'Leave' },
  { value: 'holiday', label: 'Holiday' },
];

const STATUS_MAP: Record<string, AttendanceStatus> = {
  present: AttendanceStatus.present,
  absent: AttendanceStatus.absent,
  leave: AttendanceStatus.leave,
  holiday: AttendanceStatus.holiday,
};

export default function AttendanceManagement() {
  const now = new Date();
  const { data: workers = [] } = useGetAllWorkers();
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: records = [] } = useGetAttendanceByWorker(selectedWorkerId);

  const addAtt = useOwnerAddAttendance();
  const updateAtt = useOwnerUpdateAttendance();
  const deleteAtt = useOwnerDeleteAttendance();

  const [addDialog, setAddDialog] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [addStatus, setAddStatus] = useState('present');

  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState('present');

  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState('');

  const monthRecords = records.filter(r => {
    const [y, m] = r.date.split('-').map(Number);
    return y === year && m === month;
  });

  const handleAdd = async () => {
    if (!selectedWorkerId || !addDate) return;
    setError('');
    try {
      await addAtt.mutateAsync({
        workerId: selectedWorkerId,
        date: addDate,
        status: STATUS_MAP[addStatus],
      });
      setAddDialog(false);
      setAddDate('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add attendance.';
      setError(msg.includes('already exists') ? 'Attendance already exists for this date.' : msg);
    }
  };

  const handleUpdate = async () => {
    if (!editRecord) return;
    setError('');
    try {
      await updateAtt.mutateAsync({
        recordId: editRecord.recordId,
        status: STATUS_MAP[editStatus],
      });
      setEditRecord(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update attendance.';
      setError(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    try {
      await deleteAtt.mutateAsync(deleteTarget.recordId);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete attendance.';
      setError(msg);
    }
  };

  // AttendanceCalendar calls onDateClick(date, existingRecord?)
  const handleDateClick = (date: string, existing?: AttendanceRecord) => {
    if (existing) {
      setEditRecord(existing);
      setEditStatus(existing.status as unknown as string);
    } else {
      setAddDate(date);
      setAddDialog(true);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">View and edit worker attendance records</p>
      </div>

      <Card className="shadow-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 min-w-0">
              <Label className="text-sm text-gray-600 mb-1.5 block">Select Worker</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a worker..." />
                </SelectTrigger>
                <SelectContent>
                  {workers.filter(w => w.active).map(w => (
                    <SelectItem key={w.workerId} value={w.workerId}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Month</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-28 text-center">{getMonthName(month)} {year}</span>
                <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedWorkerId ? (
        <Card className="shadow-card border-0">
          <CardContent className="py-12 text-center text-gray-400">
            Select a worker to view their attendance
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{getMonthName(month)} {year}</CardTitle>
              <Button
                size="sm"
                onClick={() => { setAddDate(''); setAddDialog(true); }}
                className="gap-1.5 text-xs h-8"
              >
                + Add Record
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AttendanceCalendar
              month={month}
              year={year}
              records={monthRecords}
              isOwner={true}
              onDateClick={handleDateClick}
            />
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Attendance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <input
                type="date"
                value={addDate}
                onChange={e => setAddDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={addStatus} onValueChange={setAddStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addAtt.isPending || !addDate}>
              {addAtt.isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Attendance — {editRecord?.date}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDeleteTarget(editRecord); setEditRecord(null); }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateAtt.isPending}>
              {updateAtt.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Delete attendance record for {deleteTarget?.date}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteAtt.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
