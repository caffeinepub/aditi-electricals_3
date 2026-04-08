import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qxfabmlkwtsukoegavpa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZmFibWxrd3RzdWtvZWdhdnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDg3MjMsImV4cCI6MjA5MDg4NDcyM30.OIrHqPfZZY9pFNo7ygMZtzLkmR2FH_XoL23s_jJm1lc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseUrl = SUPABASE_URL;
export const isLocalOnlyMode = false;

export type DbError = { message: string; code?: string } | null;
export type DbResult<T> = { data: T | null; error: DbError };

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

export function mapAdvanceEntry(row: Record<string, unknown>) {
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

export function mapCarryForwardEntry(row: Record<string, unknown>) {
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
