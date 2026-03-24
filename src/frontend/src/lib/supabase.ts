import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === "undefined") {
  console.error(
    "VITE_SUPABASE_URL is not set. Please add it to your .env file.",
  );
}
if (!supabaseAnonKey || supabaseAnonKey === "undefined") {
  console.error(
    "VITE_SUPABASE_ANON_KEY is not set. Please add it to your .env file.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
);

// Helper to map Supabase worker row to Worker interface
export function mapWorker(row: Record<string, unknown>) {
  return {
    workerId: row.worker_id as string,
    name: row.name as string,
    mobile: (row.mobile as string) || "",
    monthlySalary: BigInt((row.monthly_salary as number) || 0),
    pin: (row.pin as string) || "0000",
    active: row.active !== false,
    role: (row.role as string) || "worker",
  };
}

// Helper to map Supabase attendance row to AttendanceRecord interface
export function mapAttendance(row: Record<string, unknown>) {
  return {
    recordId: (row.record_id as string) || (row.id as string),
    workerId: row.worker_id as string,
    date: row.date as string,
    status: row.status as string,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    markedBy: (row.marked_by as string) || "worker",
    timestamp: BigInt(
      new Date((row.created_at as string) || Date.now()).getTime(),
    ),
    photo: undefined,
  };
}

export function mapHoliday(row: Record<string, unknown>) {
  return {
    holidayId: (row.holiday_id as string) || (row.id as string),
    date: row.date as string,
    name: row.name as string,
    description: row.description as string | undefined,
    createdAt: BigInt(
      new Date((row.created_at as string) || Date.now()).getTime(),
    ),
  };
}

export function mapNote(row: Record<string, unknown>) {
  return {
    noteId: (row.note_id as string) || (row.id as string),
    workerId: (row.worker_id as string) || "",
    noteType: row.note_type as string,
    content: row.content as string,
    createdBy: (row.created_by as string) || "",
    createdAt: BigInt(
      new Date((row.created_at as string) || Date.now()).getTime(),
    ),
    updatedAt: row.updated_at
      ? BigInt(new Date(row.updated_at as string).getTime())
      : undefined,
    photoUrl: row.photo_url
      ? { getDirectURL: () => row.photo_url as string }
      : undefined,
  };
}

export function mapSalary(row: Record<string, unknown>) {
  return {
    salaryId: (row.salary_id as string) || (row.id as string),
    workerId: row.worker_id as string,
    month: BigInt((row.month as number) || 0),
    year: BigInt((row.year as number) || 0),
    monthlySalary: BigInt((row.monthly_salary as number) || 0),
    presentDays: BigInt((row.present_days as number) || 0),
    absentDays: BigInt((row.absent_days as number) || 0),
    cutDays: BigInt((row.cut_days as number) || 0),
    advanceAmount: BigInt((row.advance_amount as number) || 0),
    carryForward: BigInt((row.carry_forward as number) || 0),
    companyHolidays: BigInt((row.company_holidays as number) || 0),
    manualOverride: (row.manual_override as boolean) || false,
    netPay: BigInt((row.override_net_pay as number) || 0),
  };
}

export function mapAnnouncement(row: Record<string, unknown>) {
  return {
    announcementId: (row.announcement_id as string) || (row.id as string),
    title: row.title as string,
    content: row.content as string,
    createdAt: BigInt(
      new Date((row.created_at as string) || Date.now()).getTime(),
    ),
  };
}

export function mapConfirmation(row: Record<string, unknown>) {
  return {
    confirmationId: (row.confirmation_id as string) || (row.id as string),
    workerId: row.worker_id as string,
    date: row.date as string,
    confirmed: (row.confirmed as boolean) !== false,
    confirmedAt: row.confirmed_at
      ? BigInt(new Date(row.confirmed_at as string).getTime())
      : undefined,
  };
}
