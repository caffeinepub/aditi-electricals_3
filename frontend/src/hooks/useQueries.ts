import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import {
  AttendanceStatus,
  NoteType,
  type Worker,
  type AttendanceRecord,
  type TwoPMConfirmation,
  type Note,
  type SalaryRecord,
  type Announcement,
  type Holiday,
  type UserProfile,
  ExternalBlob,
} from '../backend';

// ---- User Profile ----

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ---- Workers ----

export function useGetAllWorkers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWorkers();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetWorker(workerId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Worker | null>({
    queryKey: ['worker', workerId],
    queryFn: async () => {
      if (!actor || !workerId) return null;
      return actor.getWorker(workerId);
    },
    enabled: !!actor && !actorFetching && !!identity && !!workerId,
  });
}

export function useAddWorker() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      mobile,
      monthlySalary,
    }: {
      name: string;
      mobile: string;
      monthlySalary: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.addWorker(name, mobile, BigInt(monthlySalary));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateWorker() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workerId,
      name,
      mobile,
      monthlySalary,
      pin,
      active,
    }: {
      workerId: string;
      name: string;
      mobile: string;
      monthlySalary: number;
      pin: string;
      active: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.updateWorker(workerId, name, mobile, BigInt(monthlySalary), pin, active);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', variables.workerId] });
    },
  });
}

export function useDeleteWorker() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workerId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.deleteWorker(workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// ---- Attendance ----

export function useGetAttendanceByWorker(workerId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', workerId],
    queryFn: async () => {
      if (!actor || !workerId) return [];
      return actor.getAttendanceByWorker(workerId);
    },
    enabled: !!actor && !actorFetching && !!identity && !!workerId,
  });
}

export function useGetAttendanceByDate(workerId: string, date: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AttendanceRecord | null>({
    queryKey: ['attendance', workerId, date],
    queryFn: async () => {
      if (!actor || !workerId || !date) return null;
      return actor.getAttendanceByDate(workerId, date);
    },
    enabled: !!actor && !actorFetching && !!identity && !!workerId && !!date,
  });
}

export function useMarkAttendance() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workerId,
      status,
      latitude,
      longitude,
      photo,
    }: {
      workerId: string;
      status: AttendanceStatus;
      latitude: number | null;
      longitude: number | null;
      photo: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.markAttendance(workerId, status, latitude, longitude, photo);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.workerId] });
      queryClient.invalidateQueries({ queryKey: ['todayAttendanceAll'] });
    },
  });
}

export function useOwnerAddAttendance() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workerId,
      date,
      status,
    }: {
      workerId: string;
      date: string;
      status: AttendanceStatus;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.ownerAddAttendance(workerId, date, status);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.workerId] });
      queryClient.invalidateQueries({ queryKey: ['todayAttendanceAll'] });
    },
  });
}

export function useOwnerUpdateAttendance() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recordId,
      status,
    }: {
      recordId: string;
      status: AttendanceStatus;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.ownerUpdateAttendance(recordId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['todayAttendanceAll'] });
    },
  });
}

export function useOwnerDeleteAttendance() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.ownerDeleteAttendance(recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['todayAttendanceAll'] });
    },
  });
}

export function useGetTodayAttendanceAll() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['todayAttendanceAll'],
    queryFn: async () => {
      if (!actor) return [];
      const workers = await actor.getAllWorkers();
      const today = new Date().toISOString().split('T')[0];
      const results: AttendanceRecord[] = [];
      for (const worker of workers) {
        const record = await actor.getAttendanceByDate(worker.workerId, today);
        if (record) results.push(record);
      }
      return results;
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// ---- 2PM Confirmation ----

export function useConfirmTwoPM() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workerId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.confirmTwoPM(workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confirmations'] });
    },
  });
}

export function useGetConfirmationsByDate(date: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TwoPMConfirmation[]>({
    queryKey: ['confirmations', date],
    queryFn: async () => {
      if (!actor || !date) return [];
      return actor.getConfirmationsByDate(date);
    },
    enabled: !!actor && !actorFetching && !!identity && !!date,
  });
}

export function useGetMyConfirmation(workerId: string, date: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TwoPMConfirmation | null>({
    queryKey: ['myConfirmation', workerId, date],
    queryFn: async () => {
      if (!actor || !workerId || !date) return null;
      return actor.getMyConfirmation(workerId, date);
    },
    enabled: !!actor && !actorFetching && !!identity && !!workerId && !!date,
  });
}

// ---- Notes ----

export function useGetAllNotes() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNotes();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetMyNotes() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Note[]>({
    queryKey: ['myNotes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyNotes();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetNotesByType(noteType: NoteType) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Note[]>({
    queryKey: ['notes', noteType],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotesByType(noteType);
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddNote() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workerId,
      noteType,
      content,
      photoUrl,
    }: {
      workerId: string;
      noteType: NoteType;
      content: string;
      photoUrl: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
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
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      content,
      photoUrl,
    }: {
      noteId: string;
      content: string;
      photoUrl: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.updateNote(noteId, content, photoUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['myNotes'] });
    },
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.deleteNote(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['myNotes'] });
    },
  });
}

// ---- Salary ----

export function useGetSalaryRecord(workerId: string, month: number, year: number) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SalaryRecord | null>({
    queryKey: ['salary', workerId, month, year],
    queryFn: async () => {
      if (!actor || !workerId) return null;
      return actor.getSalaryRecord(workerId, BigInt(month), BigInt(year));
    },
    enabled: !!actor && !actorFetching && !!identity && !!workerId,
  });
}

export function useGetAllSalaryRecords() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SalaryRecord[]>({
    queryKey: ['salaryRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSalaryRecords();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddSalaryRecord() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workerId,
      month,
      year,
      monthlySalary,
      presentDays,
      absentDays,
      cutDays,
      advanceAmount,
      carryForward,
      companyHolidays,
    }: {
      workerId: string;
      month: number;
      year: number;
      monthlySalary: number;
      presentDays: number;
      absentDays: number;
      cutDays: number;
      advanceAmount: number;
      carryForward: number;
      companyHolidays: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.addSalaryRecord(
        workerId,
        BigInt(month),
        BigInt(year),
        BigInt(monthlySalary),
        BigInt(presentDays),
        BigInt(absentDays),
        BigInt(cutDays),
        BigInt(advanceAmount),
        BigInt(carryForward),
        BigInt(companyHolidays),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRecords'] });
    },
  });
}

export function useUpdateSalaryRecord() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      salaryId,
      monthlySalary,
      presentDays,
      absentDays,
      cutDays,
      advanceAmount,
      carryForward,
      companyHolidays,
      manualOverride,
      overrideNetPay,
    }: {
      salaryId: string;
      monthlySalary: number;
      presentDays: number;
      absentDays: number;
      cutDays: number;
      advanceAmount: number;
      carryForward: number;
      companyHolidays: number;
      manualOverride: boolean;
      overrideNetPay: number | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.updateSalaryRecord(
        salaryId,
        BigInt(monthlySalary),
        BigInt(presentDays),
        BigInt(absentDays),
        BigInt(cutDays),
        BigInt(advanceAmount),
        BigInt(carryForward),
        BigInt(companyHolidays),
        manualOverride,
        overrideNetPay !== null ? BigInt(overrideNetPay) : null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRecords'] });
    },
  });
}

export function useDeleteSalaryRecord() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (salaryId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.deleteSalaryRecord(salaryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary'] });
      queryClient.invalidateQueries({ queryKey: ['salaryRecords'] });
    },
  });
}

// ---- Announcements ----

export function useGetAllAnnouncements() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAnnouncements();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddAnnouncement() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.addAnnouncement(title, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useUpdateAnnouncement() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      announcementId,
      title,
      content,
    }: {
      announcementId: string;
      title: string;
      content: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.updateAnnouncement(announcementId, title, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.deleteAnnouncement(announcementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

// ---- Holidays ----

export function useGetAllHolidays() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllHolidays();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddHoliday() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      name,
      description,
    }: {
      date: string;
      name: string;
      description: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.addHoliday(date, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}

export function useEditHoliday() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      holidayId,
      date,
      name,
      description,
    }: {
      holidayId: string;
      date: string;
      name: string;
      description: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.editHoliday(holidayId, date, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}

export function useDeleteHoliday() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holidayId: string) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated. Please log in again.');
      return actor.deleteHoliday(holidayId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}
