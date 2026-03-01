import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Worker, AttendanceRecord, AttendanceStatus, Note, NoteType, SalaryRecord, Announcement, TwoPMConfirmation, ExternalBlob } from '../backend';

// ---- Workers ----

export function useGetAllWorkers() {
  const { actor, isFetching } = useActor();
  return useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWorkers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetWorker(workerId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Worker | null>({
    queryKey: ['worker', workerId],
    queryFn: async () => {
      if (!actor || !workerId) return null;
      return actor.getWorker(workerId);
    },
    enabled: !!actor && !isFetching && !!workerId,
  });
}

export function useAddWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, mobile, monthlySalary }: { name: string; mobile: string; monthlySalary: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addWorker(name, mobile, monthlySalary);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId, name, mobile, monthlySalary, pin, active,
    }: { workerId: string; name: string; mobile: string; monthlySalary: bigint; pin: string; active: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateWorker(workerId, name, mobile, monthlySalary, pin, active);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', vars.workerId] });
    },
  });
}

export function useDeleteWorker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteWorker(workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// ---- Attendance ----

export function useGetAttendanceByWorker(workerId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', workerId],
    queryFn: async () => {
      if (!actor || !workerId) return [];
      return actor.getAttendanceByWorker(workerId);
    },
    enabled: !!actor && !isFetching && !!workerId,
  });
}

export function useGetAttendanceByDate(workerId: string, date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord | null>({
    queryKey: ['attendance', workerId, date],
    queryFn: async () => {
      if (!actor || !workerId || !date) return null;
      return actor.getAttendanceByDate(workerId, date);
    },
    enabled: !!actor && !isFetching && !!workerId && !!date,
  });
}

export function useMarkAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workerId, status }: { workerId: string; status: AttendanceStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markAttendance(workerId, status);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', vars.workerId] });
    },
  });
}

export function useOwnerAddAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workerId, date, status }: { workerId: string; date: string; status: AttendanceStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.ownerAddAttendance(workerId, date, status);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', vars.workerId] });
    },
  });
}

export function useOwnerUpdateAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recordId, status }: { recordId: string; status: AttendanceStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.ownerUpdateAttendance(recordId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useOwnerDeleteAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.ownerDeleteAttendance(recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// ---- 2PM Confirmations ----

export function useGetConfirmationsByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<TwoPMConfirmation[]>({
    queryKey: ['confirmations', date],
    queryFn: async () => {
      if (!actor || !date) return [];
      return actor.getConfirmationsByDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
    refetchInterval: 30000,
  });
}

export function useGetMyConfirmation(workerId: string, date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<TwoPMConfirmation | null>({
    queryKey: ['myConfirmation', workerId, date],
    queryFn: async () => {
      if (!actor || !workerId || !date) return null;
      return actor.getMyConfirmation(workerId, date);
    },
    enabled: !!actor && !isFetching && !!workerId && !!date,
  });
}

export function useConfirmTwoPM() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.confirmTwoPM(workerId);
    },
    onSuccess: (_data, workerId) => {
      queryClient.invalidateQueries({ queryKey: ['myConfirmation', workerId] });
      queryClient.invalidateQueries({ queryKey: ['confirmations'] });
    },
  });
}

// ---- Notes ----

export function useGetAllNotes() {
  const { actor, isFetching } = useActor();
  return useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyNotes() {
  const { actor, isFetching } = useActor();
  return useQuery<Note[]>({
    queryKey: ['myNotes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyNotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetNotesByType(noteType: NoteType) {
  const { actor, isFetching } = useActor();
  return useQuery<Note[]>({
    queryKey: ['notes', noteType],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotesByType(noteType);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId, noteType, content, photoUrl,
    }: { workerId: string; noteType: NoteType; content: string; photoUrl: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addNote(workerId, noteType, content, photoUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['myNotes'] });
    },
  });
}

export function useUpdateNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId, content, photoUrl,
    }: { noteId: string; content: string; photoUrl?: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateNote(noteId, content, photoUrl ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['myNotes'] });
    },
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteNote(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['myNotes'] });
    },
  });
}

// ---- Salary ----

export function useGetAllSalaryRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<SalaryRecord[]>({
    queryKey: ['salaryRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSalaryRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSalaryRecord(workerId: string, month: number, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<SalaryRecord | null>({
    queryKey: ['salaryRecord', workerId, month, year],
    queryFn: async () => {
      if (!actor || !workerId) return null;
      return actor.getSalaryRecord(workerId, BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching && !!workerId,
  });
}

export function useAddSalaryRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      workerId: string; month: number; year: number; monthlySalary: number;
      presentDays: number; absentDays: number; cutDays: number; advanceAmount: number;
      carryForward: number; companyHolidays: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSalaryRecord(
        params.workerId, BigInt(params.month), BigInt(params.year),
        BigInt(params.monthlySalary), BigInt(params.presentDays), BigInt(params.absentDays),
        BigInt(params.cutDays), BigInt(params.advanceAmount), BigInt(params.carryForward),
        BigInt(params.companyHolidays),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryRecords'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRecord'] });
    },
  });
}

export function useUpdateSalaryRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      salaryId: string; monthlySalary: number; presentDays: number; absentDays: number;
      cutDays: number; advanceAmount: number; carryForward: number; companyHolidays: number;
      manualOverride: boolean; overrideNetPay: number | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSalaryRecord(
        params.salaryId, BigInt(params.monthlySalary), BigInt(params.presentDays),
        BigInt(params.absentDays), BigInt(params.cutDays), BigInt(params.advanceAmount),
        BigInt(params.carryForward), BigInt(params.companyHolidays),
        params.manualOverride, params.overrideNetPay !== null ? BigInt(params.overrideNetPay) : null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryRecords'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRecord'] });
    },
  });
}

export function useDeleteSalaryRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (salaryId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSalaryRecord(salaryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryRecords'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRecord'] });
    },
  });
}

// ---- Announcements ----

export function useGetAllAnnouncements() {
  const { actor, isFetching } = useActor();
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAnnouncements();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAnnouncement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAnnouncement(title, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useUpdateAnnouncement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ announcementId, title, content }: { announcementId: string; title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAnnouncement(announcementId, title, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAnnouncement(announcementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

// ---- IsAdmin check ----
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
