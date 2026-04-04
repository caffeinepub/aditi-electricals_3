import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AttendanceStatus, NoteType } from "../backend";
import {
  isSupabaseConfigured,
  localAnnouncements,
  localAttendance,
  localConfirmations,
  localHolidays,
  localNotes,
  localSalary,
  localWorkers,
} from "../lib/localDb";
import {
  mapAnnouncement,
  mapAttendance,
  mapConfirmation,
  mapHoliday,
  mapNote,
  mapSalary,
  mapWorker,
  supabase,
} from "../lib/supabase";
import { getTodayString } from "../utils/dateUtils";

function getStoredWorkerId(): string {
  try {
    return (
      JSON.parse(localStorage.getItem("aditi_auth_user_v4") || "{}").workerId ||
      ""
    );
  } catch {
    return "";
  }
}

// ---- Workers ----
export function useGetAllWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localWorkers.getAll().map(mapWorker);
      }
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .neq("role", "owner")
        .order("worker_id");
      if (error) throw error;
      return (data || []).map(mapWorker);
    },
    staleTime: 30000,
  });
}

export function useGetWorker(workerId: string) {
  return useQuery({
    queryKey: ["worker", workerId],
    queryFn: async () => {
      if (!workerId) return null;
      if (!isSupabaseConfigured()) {
        const w = localWorkers.getById(workerId);
        return w ? mapWorker(w) : null;
      }
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .eq("worker_id", workerId)
        .single();
      if (error) return null;
      return mapWorker(data!);
    },
    enabled: !!workerId,
  });
}

export function useAddWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      mobile,
      monthlySalary,
    }: { name: string; mobile: string; monthlySalary: number }) => {
      if (!isSupabaseConfigured()) {
        const workerId = localWorkers.nextWorkerId();
        localWorkers.insert({
          worker_id: workerId,
          name,
          mobile,
          monthly_salary: monthlySalary,
          pin: "0000",
          role: "worker",
          active: true,
        });
        return workerId;
      }
      const { data: existing } = await supabase
        .from("workers")
        .select("worker_id")
        .neq("role", "owner")
        .order("worker_id", { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (existing && existing.length > 0) {
        const last = existing[0].worker_id as string;
        const num = Number.parseInt(last.replace("W", ""), 10);
        if (!Number.isNaN(num)) nextNum = num + 1;
      }
      const workerId = `W${String(nextNum).padStart(3, "0")}`;

      const { data, error } = await supabase
        .from("workers")
        .insert({
          worker_id: workerId,
          name,
          mobile,
          monthly_salary: monthlySalary,
          pin: "0000",
          role: "worker",
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data!.worker_id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }),
  });
}

export function useUpdateWorker() {
  const qc = useQueryClient();
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
      if (!isSupabaseConfigured()) {
        localWorkers.update(workerId, {
          name,
          mobile,
          monthly_salary: monthlySalary,
          pin,
          active,
        });
        return;
      }
      const { error } = await supabase
        .from("workers")
        .update({ name, mobile, monthly_salary: monthlySalary, pin, active })
        .eq("worker_id", workerId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }),
  });
}

export function useDeleteWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: string) => {
      if (!isSupabaseConfigured()) {
        localWorkers.delete(workerId);
        return;
      }
      const { error } = await supabase
        .from("workers")
        .delete()
        .eq("worker_id", workerId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }),
  });
}

export function useChangeWorkerPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      newPin,
    }: { workerId: string; newPin: string }) => {
      if (!isSupabaseConfigured()) {
        localWorkers.update(workerId, { pin: newPin });
        return;
      }
      const { error } = await supabase
        .from("workers")
        .update({ pin: newPin })
        .eq("worker_id", workerId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workers"] }),
  });
}

export function useChangeMyPin() {
  return useMutation({
    mutationFn: async ({
      currentPin,
      newPin,
      workerId,
    }: {
      currentPin: string;
      newPin: string;
      workerId?: string;
    }) => {
      const wid = workerId || getStoredWorkerId();
      if (!isSupabaseConfigured()) {
        const w = localWorkers.getById(wid);
        if (!w || w.pin !== currentPin)
          throw new Error("Current PIN is incorrect");
        localWorkers.update(wid, { pin: newPin });
        return;
      }
      const { data } = await supabase
        .from("workers")
        .select("pin")
        .eq("worker_id", wid)
        .single();
      if (!data || data.pin !== currentPin)
        throw new Error("Current PIN is incorrect");
      const { error } = await supabase
        .from("workers")
        .update({ pin: newPin })
        .eq("worker_id", wid);
      if (error) throw error;
    },
  });
}

// ---- Attendance ----
export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      status,
      latitude,
      longitude,
    }: {
      workerId: string;
      status: AttendanceStatus | string;
      latitude: number | null;
      longitude: number | null;
      photo?: unknown;
    }) => {
      const today = getTodayString();
      if (!isSupabaseConfigured()) {
        const record = localAttendance.upsert({
          worker_id: workerId,
          date: today,
          status,
          latitude,
          longitude,
          marked_by: "worker",
        });
        return record.id as string;
      }
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("worker_id", workerId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("attendance")
          .update({ status, latitude, longitude, marked_by: "worker" })
          .eq("worker_id", workerId)
          .eq("date", today);
        if (error) throw error;
        return existing.id as string;
      }
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          worker_id: workerId,
          date: today,
          status,
          latitude,
          longitude,
          marked_by: "worker",
        })
        .select()
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendanceByWorker"] });
      qc.invalidateQueries({ queryKey: ["ownerAttendance"] });
      qc.invalidateQueries({ queryKey: ["ownerAttendanceDate"] });
    },
  });
}

export function useGetAttendanceByDate(workerId: string, date: string) {
  return useQuery({
    queryKey: ["attendance", workerId, date],
    queryFn: async () => {
      if (!workerId || !date) return null;
      if (!isSupabaseConfigured()) {
        const r = localAttendance.getByWorkerDate(workerId, date);
        return r ? mapAttendance(r) : null;
      }
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("worker_id", workerId)
        .eq("date", date)
        .maybeSingle();
      return data ? mapAttendance(data) : null;
    },
    enabled: !!workerId && !!date,
  });
}

export function useGetAttendanceByWorker(workerId: string) {
  return useQuery({
    queryKey: ["attendanceByWorker", workerId],
    queryFn: async () => {
      if (!workerId) return [];
      if (!isSupabaseConfigured()) {
        return localAttendance.getByWorker(workerId).map(mapAttendance);
      }
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("worker_id", workerId)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapAttendance);
    },
    enabled: !!workerId,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useGetAttendanceByWorkerForMonth(
  workerId: string,
  month: number,
  year: number,
) {
  return useQuery({
    queryKey: ["attendance", workerId, month, year],
    queryFn: async () => {
      if (!workerId) return [];
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const end = `${year}-${String(month).padStart(2, "0")}-31`;
      if (!isSupabaseConfigured()) {
        return localAttendance
          .getByWorkerMonth(workerId, start, end)
          .map(mapAttendance);
      }
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("worker_id", workerId)
        .gte("date", start)
        .lte("date", end);
      if (error) throw error;
      return (data || []).map(mapAttendance);
    },
    enabled: !!workerId,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useOwnerGetAttendanceByWorkerForMonth(
  workerId: string,
  month: number,
  year: number,
) {
  return useGetAttendanceByWorkerForMonth(workerId, month, year);
}

export function useOwnerGetAttendanceForDate(date: string) {
  return useQuery({
    queryKey: ["ownerAttendanceDate", date],
    queryFn: async () => {
      if (!date) return [];
      if (!isSupabaseConfigured()) {
        return localAttendance.getByDate(date).map(mapAttendance);
      }
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", date);
      if (error) throw error;
      return (data || []).map(mapAttendance);
    },
    enabled: !!date,
  });
}

export function useGetTodayAttendanceAll() {
  const today = getTodayString();
  return useOwnerGetAttendanceForDate(today);
}

export function useOwnerAddAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      date,
      status,
    }: {
      workerId: string;
      date: string;
      status: AttendanceStatus | string;
    }) => {
      if (!isSupabaseConfigured()) {
        const record = localAttendance.upsert({
          worker_id: workerId,
          date,
          status,
          marked_by: "owner",
        });
        return record.id as string;
      }
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("worker_id", workerId)
        .eq("date", date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("attendance")
          .update({ status, marked_by: "owner" })
          .eq("worker_id", workerId)
          .eq("date", date);
        if (error) throw error;
        return existing.id as string;
      }
      const { data, error } = await supabase
        .from("attendance")
        .insert({ worker_id: workerId, date, status, marked_by: "owner" })
        .select()
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerAttendance"] });
      qc.invalidateQueries({ queryKey: ["ownerAttendanceDate"] });
      qc.invalidateQueries({ queryKey: ["attendanceByWorker"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useOwnerUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      status,
    }: { recordId: string; status: AttendanceStatus | string }) => {
      if (!isSupabaseConfigured()) {
        localAttendance.updateById(recordId, { status, marked_by: "owner" });
        return;
      }
      const { error } = await supabase
        .from("attendance")
        .update({ status, marked_by: "owner" })
        .eq("id", recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerAttendance"] });
      qc.invalidateQueries({ queryKey: ["ownerAttendanceDate"] });
      qc.invalidateQueries({ queryKey: ["attendanceByWorker"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useOwnerDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!isSupabaseConfigured()) {
        localAttendance.deleteById(recordId);
        return;
      }
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerAttendance"] });
      qc.invalidateQueries({ queryKey: ["ownerAttendanceDate"] });
      qc.invalidateQueries({ queryKey: ["attendanceByWorker"] });
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

// ---- Dashboard ----
export function useGetDashboardStats() {
  const today = getTodayString();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        const workers = localWorkers.getAll();
        const todayAtt = localAttendance.getByDate(today);
        const confirms = localConfirmations.getByDate(today);
        return {
          totalWorkers: BigInt(workers.length),
          todayPresent: BigInt(
            todayAtt.filter((r) => r.status === "present").length,
          ),
          todayAbsent: BigInt(
            todayAtt.filter((r) => r.status === "absent").length,
          ),
          twoPMConfirmations: BigInt(confirms.length),
        };
      }
      const [workersRes, todayAttRes, confirmRes] = await Promise.all([
        supabase.from("workers").select("worker_id").neq("role", "owner"),
        supabase.from("attendance").select("status").eq("date", today),
        supabase.from("confirmations").select("worker_id").eq("date", today),
      ]);
      const totalWorkers = BigInt(
        Array.isArray(workersRes.data) ? workersRes.data.length : 0,
      );
      const todayPresent = BigInt(
        (todayAttRes.data || []).filter((r) => r.status === "present").length,
      );
      const todayAbsent = BigInt(
        (todayAttRes.data || []).filter((r) => r.status === "absent").length,
      );
      const twoPMConfirmations = BigInt(
        Array.isArray(confirmRes.data) ? confirmRes.data.length : 0,
      );
      return { totalWorkers, todayPresent, todayAbsent, twoPMConfirmations };
    },
    refetchInterval: 60000,
  });
}

export function useGetMonthlySummary(month: number, year: number) {
  return useQuery({
    queryKey: ["monthlySummary", month, year],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        const start = `${year}-${String(month).padStart(2, "0")}-01`;
        const end = `${year}-${String(month).padStart(2, "0")}-31`;
        const workers = localWorkers.getAll();
        return workers.map((w) => {
          const records = localAttendance.getByWorkerMonth(
            w.worker_id as string,
            start,
            end,
          );
          return {
            workerId: w.worker_id as string,
            workerName: w.name as string,
            presentDays: BigInt(
              records.filter((r) => r.status === "present").length,
            ),
            absentDays: BigInt(
              records.filter((r) => r.status === "absent").length,
            ),
            leaveDays: BigInt(
              records.filter((r) => r.status === "leave").length,
            ),
          };
        });
      }
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const end = `${year}-${String(month).padStart(2, "0")}-31`;
      const [workersRes, attRes] = await Promise.all([
        supabase.from("workers").select("worker_id, name").neq("role", "owner"),
        supabase
          .from("attendance")
          .select("worker_id, status")
          .gte("date", start)
          .lte("date", end),
      ]);
      const workers = workersRes.data || [];
      const att = attRes.data || [];
      return workers.map((w) => {
        const records = att.filter((r) => r.worker_id === w.worker_id);
        return {
          workerId: w.worker_id as string,
          workerName: w.name as string,
          presentDays: BigInt(
            records.filter((r) => r.status === "present").length,
          ),
          absentDays: BigInt(
            records.filter((r) => r.status === "absent").length,
          ),
          leaveDays: BigInt(records.filter((r) => r.status === "leave").length),
        };
      });
    },
  });
}

// ---- 2PM Confirmations ----
export function useConfirmTwoPM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workerId: string) => {
      const today = getTodayString();
      if (!isSupabaseConfigured()) {
        const existing = localConfirmations.getByWorkerDate(workerId, today);
        if (existing) return existing.id as string;
        const record = localConfirmations.insert({
          worker_id: workerId,
          date: today,
          confirmed: true,
        });
        return record.id as string;
      }
      const { data: existing } = await supabase
        .from("confirmations")
        .select("id")
        .eq("worker_id", workerId)
        .eq("date", today)
        .maybeSingle();
      if (existing) return existing.id as string;

      const { data, error } = await supabase
        .from("confirmations")
        .insert({ worker_id: workerId, date: today, confirmed: true })
        .select()
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["confirmations"] }),
  });
}

export function useGetConfirmationsByDate(date: string) {
  return useQuery({
    queryKey: ["confirmations", date],
    queryFn: async () => {
      if (!date) return [];
      if (!isSupabaseConfigured()) {
        return localConfirmations.getByDate(date).map(mapConfirmation);
      }
      const { data, error } = await supabase
        .from("confirmations")
        .select("*")
        .eq("date", date);
      if (error) throw error;
      return (data || []).map(mapConfirmation);
    },
    enabled: !!date,
  });
}

export function useGetMyConfirmation(workerId: string, date: string) {
  return useQuery({
    queryKey: ["myConfirmation", workerId, date],
    queryFn: async () => {
      if (!workerId || !date) return null;
      if (!isSupabaseConfigured()) {
        const r = localConfirmations.getByWorkerDate(workerId, date);
        return r ? mapConfirmation(r) : null;
      }
      const { data } = await supabase
        .from("confirmations")
        .select("*")
        .eq("worker_id", workerId)
        .eq("date", date)
        .maybeSingle();
      return data ? mapConfirmation(data) : null;
    },
    enabled: !!workerId && !!date,
  });
}

// ---- Notes ----
export function useGetAllNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localNotes.getAll().map(mapNote);
      }
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapNote);
    },
  });
}

export function useGetMyNotes() {
  const workerId = getStoredWorkerId();
  return useQuery({
    queryKey: ["myNotes", workerId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        const allNotes = localNotes.getAll();
        const filtered = allNotes.filter(
          (n: Record<string, unknown>) =>
            n.worker_id === workerId || n.note_type === "ownerInstruction",
        );
        return filtered.map(mapNote);
      }
      // Two separate queries then merge (supabase client doesn't support OR filter)
      const [ownRes, instrRes] = await Promise.all([
        supabase
          .from("notes")
          .select("*")
          .eq("worker_id", workerId)
          .order("created_at", { ascending: false }),
        supabase
          .from("notes")
          .select("*")
          .eq("note_type", "ownerInstruction")
          .order("created_at", { ascending: false }),
      ]);
      if (ownRes.error) throw ownRes.error;
      const combined = [...(ownRes.data || []), ...(instrRes.data || [])];
      const seen = new Set<string>();
      const unique = combined.filter((n: Record<string, unknown>) => {
        const id = (n.id || n.note_id) as string;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      unique.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((b.created_at as string) || "").localeCompare(
          (a.created_at as string) || "",
        ),
      );
      return unique.map(mapNote);
    },
  });
}

export function useGetNotesByWorker(workerId: string) {
  return useQuery({
    queryKey: ["notesByWorker", workerId],
    queryFn: async () => {
      if (!workerId) return [];
      if (!isSupabaseConfigured()) {
        return localNotes.getByWorker(workerId).map(mapNote);
      }
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("worker_id", workerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapNote);
    },
    enabled: !!workerId,
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      noteType,
      content,
      photoUrl,
      createdBy,
    }: {
      workerId: string;
      noteType: NoteType | string;
      content: string;
      photoUrl?: { getDirectURL?: () => string } | null;
      createdBy?: string;
    }) => {
      const photoUrlStr =
        photoUrl && typeof photoUrl.getDirectURL === "function"
          ? photoUrl.getDirectURL()
          : null;
      const by = createdBy || getStoredWorkerId() || "";

      if (!isSupabaseConfigured()) {
        const record = localNotes.insert({
          worker_id: workerId || null,
          note_type: noteType,
          content,
          photo_url: photoUrlStr,
          created_by: by,
        });
        return record.id as string;
      }
      const { data, error } = await supabase
        .from("notes")
        .insert({
          worker_id: workerId || null,
          note_type: noteType,
          content,
          photo_url: photoUrlStr,
          created_by: by,
        })
        .select()
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["myNotes"] });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      content,
      photoUrl,
    }: {
      noteId: string;
      content: string;
      photoUrl?: { getDirectURL?: () => string } | null;
    }) => {
      const photoUrlStr =
        photoUrl && typeof photoUrl.getDirectURL === "function"
          ? photoUrl.getDirectURL()
          : null;

      if (!isSupabaseConfigured()) {
        localNotes.update(noteId, { content, photo_url: photoUrlStr });
        return;
      }
      const { error } = await supabase
        .from("notes")
        .update({
          content,
          photo_url: photoUrlStr,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["myNotes"] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!isSupabaseConfigured()) {
        localNotes.delete(noteId);
        return;
      }
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["myNotes"] });
    },
  });
}

// ---- Salary ----
export function useGetSalaryRecord(
  workerId: string,
  month: number,
  year: number,
) {
  return useQuery({
    queryKey: ["salary", workerId, month, year],
    queryFn: async () => {
      if (!workerId) return null;
      if (!isSupabaseConfigured()) {
        const r = localSalary.get(workerId, month, year);
        return r ? mapSalary(r) : null;
      }
      const { data } = await supabase
        .from("salary_records")
        .select("*")
        .eq("worker_id", workerId)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();
      return data ? mapSalary(data) : null;
    },
    enabled: !!workerId,
  });
}

export function useAddSalaryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
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
      if (!isSupabaseConfigured()) {
        const record = localSalary.insert({
          worker_id: params.workerId,
          month: params.month,
          year: params.year,
          monthly_salary: params.monthlySalary,
          present_days: params.presentDays,
          absent_days: params.absentDays,
          cut_days: params.cutDays,
          advance_amount: params.advanceAmount,
          carry_forward: params.carryForward,
          company_holidays: params.companyHolidays,
        });
        return record.id as string;
      }
      const { data, error } = await supabase
        .from("salary_records")
        .insert({
          worker_id: params.workerId,
          month: params.month,
          year: params.year,
          monthly_salary: params.monthlySalary,
          present_days: params.presentDays,
          absent_days: params.absentDays,
          cut_days: params.cutDays,
          advance_amount: params.advanceAmount,
          carry_forward: params.carryForward,
          company_holidays: params.companyHolidays,
        })
        .select()
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary"] }),
  });
}

export function useUpdateSalaryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
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
      if (!isSupabaseConfigured()) {
        localSalary.update(params.salaryId, {
          monthly_salary: params.monthlySalary,
          present_days: params.presentDays,
          absent_days: params.absentDays,
          cut_days: params.cutDays,
          advance_amount: params.advanceAmount,
          carry_forward: params.carryForward,
          company_holidays: params.companyHolidays,
          manual_override: params.manualOverride,
          override_net_pay: params.overrideNetPay,
        });
        return;
      }
      const { error } = await supabase
        .from("salary_records")
        .update({
          monthly_salary: params.monthlySalary,
          present_days: params.presentDays,
          absent_days: params.absentDays,
          cut_days: params.cutDays,
          advance_amount: params.advanceAmount,
          carry_forward: params.carryForward,
          company_holidays: params.companyHolidays,
          manual_override: params.manualOverride,
          override_net_pay: params.overrideNetPay,
        })
        .eq("id", params.salaryId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary"] }),
  });
}

// ---- Holidays ----
export function useGetAllHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localHolidays.getAll().map(mapHoliday);
      }
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .order("date");
      if (error) throw error;
      return (data || []).map(mapHoliday);
    },
  });
}

export function useAddHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      name,
      description,
    }: { date: string; name: string; description: string | null }) => {
      if (!isSupabaseConfigured()) {
        const record = localHolidays.insert({ date, name, description });
        return record.id as string;
      }
      const { data, error } = await supabase
        .from("holidays")
        .insert({ date, name, description })
        .select()
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useEditHoliday() {
  const qc = useQueryClient();
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
      if (!isSupabaseConfigured()) {
        localHolidays.update(holidayId, { date, name, description });
        return;
      }
      const { error } = await supabase
        .from("holidays")
        .update({ date, name, description })
        .eq("id", holidayId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (holidayId: string) => {
      if (!isSupabaseConfigured()) {
        localHolidays.delete(holidayId);
        return;
      }
      const { error } = await supabase
        .from("holidays")
        .delete()
        .eq("id", holidayId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

// ---- Announcements ----
export function useGetAllAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localAnnouncements.getAll().map(mapAnnouncement);
      }
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapAnnouncement);
    },
  });
}

export function useAddAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      content,
    }: { title: string; content: string }) => {
      if (!isSupabaseConfigured()) {
        const record = localAnnouncements.insert({ title, content });
        return record.id as string;
      }
      const { data, error } = await supabase
        .from("announcements")
        .insert({ title, content })
        .select()
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      announcementId,
      title,
      content,
    }: { announcementId: string; title: string; content: string }) => {
      if (!isSupabaseConfigured()) {
        localAnnouncements.update(announcementId, { title, content });
        return;
      }
      const { error } = await supabase
        .from("announcements")
        .update({ title, content })
        .eq("id", announcementId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: string) => {
      if (!isSupabaseConfigured()) {
        localAnnouncements.delete(announcementId);
        return;
      }
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcementId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

// ---- Owner Registration (no-op for Supabase) ----
export function useRegisterOwner() {
  return useMutation({
    mutationFn: async () => {
      /* Owner exists in DB */
    },
  });
}

export function useGetOwnerStatus() {
  return useQuery({
    queryKey: ["ownerStatus"],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return { ownerRegistered: true, isOwner: true };
      }
      const { data } = await supabase
        .from("workers")
        .select("worker_id")
        .eq("role", "owner")
        .maybeSingle();
      return { ownerRegistered: !!data, isOwner: true };
    },
  });
}

export function useLinkWorkerPrincipal() {
  return useMutation({
    mutationFn: async (_workerId: string) => {
      /* No-op for Supabase */
    },
  });
}

// ---- Advance Entries ----

export interface AdvanceEntry {
  id: string;
  workerId: string;
  month: number;
  year: number;
  amount: number;
  entryDate: string;
  entryTime: string;
  createdAt: string;
}

export function useGetAdvanceEntries(
  workerId: string,
  month: number,
  year: number,
) {
  return useQuery<AdvanceEntry[]>({
    queryKey: ["advanceEntries", workerId, month, year],
    queryFn: async () => {
      if (!workerId) return [];
      if (!isSupabaseConfigured()) {
        const { localAdvanceEntries } = await import("../lib/localDb");
        const { mapAdvanceEntry } = await import("../lib/supabase");
        return localAdvanceEntries
          .getByWorkerMonth(workerId, month, year)
          .map(mapAdvanceEntry);
      }
      const { mapAdvanceEntry } = await import("../lib/supabase");
      const { data, error } = await supabase
        .from("advance_entries")
        .select("*")
        .eq("worker_id", workerId)
        .eq("month", month)
        .eq("year", year)
        .order("entry_date");
      if (error) throw error;
      return (data || []).map(mapAdvanceEntry);
    },
    enabled: !!workerId,
  });
}

export function useAddAdvanceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      month,
      year,
      amount,
      entryDate,
      entryTime,
    }: {
      workerId: string;
      month: number;
      year: number;
      amount: number;
      entryDate: string;
      entryTime: string;
    }) => {
      if (!isSupabaseConfigured()) {
        const { localAdvanceEntries } = await import("../lib/localDb");
        const record = localAdvanceEntries.insert({
          worker_id: workerId,
          month,
          year,
          amount,
          entry_date: entryDate,
          entry_time: entryTime,
        });
        return record.id as string;
      }
      const { data, error } = await supabase
        .from("advance_entries")
        .insert({
          worker_id: workerId,
          month,
          year,
          amount,
          entry_date: entryDate,
          entry_time: entryTime,
        })
        .select()
        .single();
      if (error) throw error;
      return (data as Record<string, unknown>)!.id as string;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["advanceEntries", vars.workerId, vars.month, vars.year],
      });
    },
  });
}

export function useDeleteAdvanceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      workerId: _workerId,
      month: _month,
      year: _year,
    }: {
      id: string;
      workerId: string;
      month: number;
      year: number;
    }) => {
      if (!isSupabaseConfigured()) {
        const { localAdvanceEntries } = await import("../lib/localDb");
        localAdvanceEntries.deleteById(id);
        return;
      }
      const { error } = await supabase
        .from("advance_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["advanceEntries", vars.workerId, vars.month, vars.year],
      });
    },
  });
}

// ---- Carry Forward Entries ----

export interface CarryForwardEntry {
  id: string;
  workerId: string;
  month: number;
  year: number;
  amount: number;
  entryDate: string;
  entryTime: string;
  createdAt: string;
}

export function useGetCarryForwardEntries(
  workerId: string,
  month: number,
  year: number,
) {
  return useQuery<CarryForwardEntry[]>({
    queryKey: ["carryForwardEntries", workerId, month, year],
    queryFn: async () => {
      if (!workerId) return [];
      if (!isSupabaseConfigured()) {
        const { localCarryForwardEntries } = await import("../lib/localDb");
        const { mapCarryForwardEntry } = await import("../lib/supabase");
        return localCarryForwardEntries
          .getByWorkerMonth(workerId, month, year)
          .map(mapCarryForwardEntry);
      }
      const { mapCarryForwardEntry } = await import("../lib/supabase");
      const { data, error } = await supabase
        .from("carry_forward_entries")
        .select("*")
        .eq("worker_id", workerId)
        .eq("month", month)
        .eq("year", year)
        .order("entry_date");
      if (error) throw error;
      return (data || []).map(mapCarryForwardEntry);
    },
    enabled: !!workerId,
  });
}

export function useAddCarryForwardEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      month,
      year,
      amount,
      entryDate,
      entryTime,
    }: {
      workerId: string;
      month: number;
      year: number;
      amount: number;
      entryDate: string;
      entryTime: string;
    }) => {
      if (!isSupabaseConfigured()) {
        const { localCarryForwardEntries } = await import("../lib/localDb");
        const record = localCarryForwardEntries.insert({
          worker_id: workerId,
          month,
          year,
          amount,
          entry_date: entryDate,
          entry_time: entryTime,
        });
        return record.id as string;
      }
      const { data, error } = await supabase
        .from("carry_forward_entries")
        .insert({
          worker_id: workerId,
          month,
          year,
          amount,
          entry_date: entryDate,
          entry_time: entryTime,
        })
        .select()
        .single();
      if (error) throw error;
      return (data as Record<string, unknown>)!.id as string;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["carryForwardEntries", vars.workerId, vars.month, vars.year],
      });
    },
  });
}

export function useDeleteCarryForwardEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      workerId: _workerId,
      month: _month,
      year: _year,
    }: {
      id: string;
      workerId: string;
      month: number;
      year: number;
    }) => {
      if (!isSupabaseConfigured()) {
        const { localCarryForwardEntries } = await import("../lib/localDb");
        localCarryForwardEntries.deleteById(id);
        return;
      }
      const { error } = await supabase
        .from("carry_forward_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["carryForwardEntries", vars.workerId, vars.month, vars.year],
      });
    },
  });
}

// ---- Evening Locations ----

export interface EveningLocation {
  id: string;
  workerId: string;
  date: string;
  latitude: number;
  longitude: number;
  capturedAt: string; // ISO timestamp
  createdAt: string;
}

export function mapEveningLocation(
  row: Record<string, unknown>,
): EveningLocation {
  return {
    id: row.id as string,
    workerId: row.worker_id as string,
    date: row.date as string,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    capturedAt:
      (row.captured_at as string) ||
      (row.created_at as string) ||
      new Date().toISOString(),
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export function useGetEveningLocationsByDate(date: string) {
  return useQuery<EveningLocation[]>({
    queryKey: ["eveningLocations", date],
    queryFn: async () => {
      if (!date) return [];
      if (!isSupabaseConfigured()) {
        const { localEveningLocations } = await import("../lib/localDb");
        return localEveningLocations.getByDate(date).map(mapEveningLocation);
      }
      const { data, error } = await supabase
        .from("evening_locations")
        .select("*")
        .eq("date", date)
        .order("captured_at");
      if (error) return [];
      return (data || []).map(mapEveningLocation);
    },
    enabled: !!date,
    refetchInterval: 30000,
  });
}

export function useSaveEveningLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workerId,
      date,
      latitude,
      longitude,
    }: {
      workerId: string;
      date: string;
      latitude: number;
      longitude: number;
    }) => {
      const capturedAt = new Date().toISOString();
      if (!isSupabaseConfigured()) {
        const { localEveningLocations } = await import("../lib/localDb");
        const record = localEveningLocations.upsert({
          worker_id: workerId,
          date,
          latitude,
          longitude,
          captured_at: capturedAt,
        });
        return record.id as string;
      }
      // Upsert: one record per worker per day
      const { data: existing } = await supabase
        .from("evening_locations")
        .select("id")
        .eq("worker_id", workerId)
        .eq("date", date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("evening_locations")
          .update({ latitude, longitude, captured_at: capturedAt })
          .eq("worker_id", workerId)
          .eq("date", date);
        if (error) throw error;
        return (existing as Record<string, unknown>).id as string;
      }
      const { data, error } = await supabase
        .from("evening_locations")
        .insert({
          worker_id: workerId,
          date,
          latitude,
          longitude,
          captured_at: capturedAt,
        })
        .select()
        .single();
      if (error) throw error;
      return (data as Record<string, unknown>)!.id as string;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["eveningLocations", vars.date] });
    },
  });
}
