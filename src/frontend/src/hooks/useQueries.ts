import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { AttendanceStatus, NoteType } from "../types/appTypes";
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
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .neq("role", "owner")
        .order("worker_id");
      if (error) {
        console.error("useGetAllWorkers error:", error.code, error.message);
        return [];
      }
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
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .eq("worker_id", workerId)
        .maybeSingle();
      if (error) {
        console.error("useGetWorker error:", error.code, error.message);
        return null;
      }
      return data ? mapWorker(data) : null;
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
      const { data: existing } = await supabase
        .from("workers")
        .select("worker_id")
        .neq("role", "owner")
        .order("worker_id", { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (existing && existing.length > 0) {
        const last = (existing[0] as Record<string, unknown>)
          .worker_id as string;
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
      return (data as Record<string, unknown>)!.worker_id as string;
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
      const { data } = await supabase
        .from("workers")
        .select("pin")
        .eq("worker_id", wid)
        .maybeSingle();
      if (!data || (data as Record<string, unknown>).pin !== currentPin)
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
        return (existing as Record<string, unknown>).id as string;
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
      return (data as Record<string, unknown>)!.id as string;
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
        return (existing as Record<string, unknown>).id as string;
      }
      const { data, error } = await supabase
        .from("attendance")
        .insert({ worker_id: workerId, date, status, marked_by: "owner" })
        .select()
        .single();
      if (error) throw error;
      return (data as Record<string, unknown>)!.id as string;
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
      const [workersRes, todayAttRes, confirmRes] = await Promise.all([
        supabase.from("workers").select("worker_id").neq("role", "owner"),
        supabase.from("attendance").select("status").eq("date", today),
        supabase.from("confirmations").select("worker_id").eq("date", today),
      ]);
      const totalWorkers = BigInt(
        Array.isArray(workersRes.data) ? workersRes.data.length : 0,
      );
      const todayPresent = BigInt(
        ((todayAttRes.data || []) as Record<string, unknown>[]).filter(
          (r) => r.status === "present",
        ).length,
      );
      const todayAbsent = BigInt(
        ((todayAttRes.data || []) as Record<string, unknown>[]).filter(
          (r) => r.status === "absent",
        ).length,
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
      const workers = (workersRes.data || []) as Record<string, unknown>[];
      const att = (attRes.data || []) as Record<string, unknown>[];
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
      const { data: existing } = await supabase
        .from("confirmations")
        .select("id")
        .eq("worker_id", workerId)
        .eq("date", today)
        .maybeSingle();
      if (existing) return (existing as Record<string, unknown>).id as string;

      const { data, error } = await supabase
        .from("confirmations")
        .insert({ worker_id: workerId, date: today, confirmed: true })
        .select()
        .single();
      if (error) throw error;
      return (data as Record<string, unknown>)!.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["confirmations"] }),
  });
}

export function useGetConfirmationsByDate(date: string) {
  return useQuery({
    queryKey: ["confirmations", date],
    queryFn: async () => {
      if (!date) return [];
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
      const combined = [
        ...((ownRes.data || []) as Record<string, unknown>[]),
        ...((instrRes.data || []) as Record<string, unknown>[]),
      ];
      const seen = new Set<string>();
      const unique = combined.filter((n) => {
        const id = ((n.id || n.note_id) as string) || "";
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      unique.sort((a, b) =>
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
      return (data as Record<string, unknown>)!.id as string;
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
      return (data as Record<string, unknown>)!.id as string;
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
      const { data, error } = await supabase
        .from("holidays")
        .insert({ date, name, description })
        .select()
        .single();
      if (error) throw error;
      return (data as Record<string, unknown>)!.id as string;
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
      const { data, error } = await supabase
        .from("announcements")
        .insert({ title, content })
        .select()
        .single();
      if (error) throw error;
      return (data as Record<string, unknown>)!.id as string;
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
      /* Owner exists in DB — no-op */
    },
  });
}

export function useGetOwnerStatus() {
  return useQuery({
    queryKey: ["ownerStatus"],
    queryFn: async () => {
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

function mapAdvanceEntry(row: Record<string, unknown>): AdvanceEntry {
  return {
    id: row.id as string,
    workerId: row.worker_id as string,
    month: row.month as number,
    year: row.year as number,
    amount: Number(row.amount) || 0,
    entryDate: row.entry_date as string,
    entryTime: (row.entry_time as string) || "00:00",
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
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
      const { data, error } = await supabase
        .from("advance_entries")
        .select("*")
        .eq("worker_id", workerId)
        .eq("month", month)
        .eq("year", year)
        .order("entry_date");
      if (error) {
        console.error("useGetAdvanceEntries error:", error.code, error.message);
        return [];
      }
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

function mapCarryForwardEntry(row: Record<string, unknown>): CarryForwardEntry {
  return {
    id: row.id as string,
    workerId: row.worker_id as string,
    month: row.month as number,
    year: row.year as number,
    amount: Number(row.amount) || 0,
    entryDate: row.entry_date as string,
    entryTime: (row.entry_time as string) || "00:00",
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
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
      const { data, error } = await supabase
        .from("carry_forward_entries")
        .select("*")
        .eq("worker_id", workerId)
        .eq("month", month)
        .eq("year", year)
        .order("entry_date");
      if (error) {
        console.error(
          "useGetCarryForwardEntries error:",
          error.code,
          error.message,
        );
        return [];
      }
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
  capturedAt: string;
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
