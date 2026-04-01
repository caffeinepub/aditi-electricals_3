// Compatible type definitions for Supabase-backed app
// Replaces ICP Motoko backend types

import type { HttpAgentOptions } from "@icp-sdk/core/agent";

export type WorkerId = string;
export type AttendanceId = string;
export type NoteId = string;
export type HolidayId = string;
export type SalaryId = string;
export type AnnouncementId = string;
export type ConfirmationId = string;
export type Time = bigint;

export class ExternalBlob {
  private _url: string = "";
  private _bytes: Uint8Array | null = null;
  onProgress?: (pct: number) => void;

  getDirectURL(): string {
    return this._url;
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    const r = await fetch(this._url);
    const ab = await r.arrayBuffer();
    return new Uint8Array(ab);
  }

  static fromURL(url: string): ExternalBlob {
    const b = new ExternalBlob();
    b._url = url;
    return b;
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const b = new ExternalBlob();
    b._bytes = bytes;
    b._url = URL.createObjectURL(new Blob([bytes as BlobPart]));
    return b;
  }

  withUploadProgress(onProgress: (pct: number) => void): ExternalBlob {
    this.onProgress = onProgress;
    return this;
  }
}

export enum AttendanceStatus {
  present = "present",
  absent = "absent",
  leave = "leave",
  holiday = "holiday",
}

export enum NoteType {
  work = "work",
  material = "material",
  ownerInstruction = "ownerInstruction",
  perWorker = "perWorker",
}

export enum UserRole {
  admin = "admin",
  user = "user",
  guest = "guest",
}

export interface Worker {
  workerId: WorkerId;
  name: string;
  mobile: string;
  monthlySalary: bigint;
  pin: string;
  active: boolean;
  role?: string;
}

export interface AttendanceRecord {
  recordId: AttendanceId;
  workerId: WorkerId;
  date: string;
  status: AttendanceStatus | string;
  latitude?: number;
  longitude?: number;
  markedBy: string;
  timestamp: Time;
  photo?: ExternalBlob;
}

export type AttendanceRecordPublic = AttendanceRecord;

export interface Note {
  noteId: NoteId;
  workerId: WorkerId;
  noteType: NoteType | string;
  content: string;
  createdBy: string;
  createdAt: Time;
  updatedAt?: Time;
  photoUrl?: { getDirectURL: () => string } | ExternalBlob;
}

export interface Holiday {
  holidayId: HolidayId;
  date: string;
  name: string;
  description?: string;
  createdAt: Time;
}

export interface SalaryRecord {
  salaryId: SalaryId;
  workerId: WorkerId;
  month: bigint;
  year: bigint;
  monthlySalary: bigint;
  presentDays: bigint;
  absentDays: bigint;
  cutDays: bigint;
  advanceAmount: bigint;
  carryForward: bigint;
  companyHolidays: bigint;
  manualOverride: boolean;
  netPay: bigint;
}

export interface Announcement {
  announcementId: AnnouncementId;
  title: string;
  content: string;
  createdAt: Time;
}

export interface TwoPMConfirmation {
  confirmationId: ConfirmationId;
  workerId: WorkerId;
  date: string;
  confirmed: boolean;
  confirmedAt?: Time;
}

export interface DashboardStats {
  totalWorkers: bigint;
  todayPresent: bigint;
  todayAbsent: bigint;
  twoPMConfirmations: bigint;
}

export interface MonthlySummaryEntry {
  workerId: WorkerId;
  workerName: string;
  presentDays: bigint;
  absentDays: bigint;
  leaveDays: bigint;
}

export interface UserProfile {
  workerId?: string;
  name: string;
  role: string;
}

export interface Some<T> {
  __kind__: "Some";
  value: T;
}
export interface None {
  __kind__: "None";
}
export type Option<T> = Some<T> | None;

// Stub types/functions required by config.ts and useActor.ts (legacy ICP compatibility)
export interface backendInterface {
  _initializeAccessControlWithSecret(token: string): Promise<void>;
  [key: string]: unknown;
}

export interface CreateActorOptions {
  agentOptions?: HttpAgentOptions;
  agent?: unknown;
  processError?: (e: unknown) => never;
  [key: string]: unknown;
}

export function createActor(
  _canisterId: string,
  _uploadFile: unknown,
  _downloadFile: unknown,
  _options?: CreateActorOptions,
): backendInterface {
  return {
    _initializeAccessControlWithSecret: async () => {},
  } as backendInterface;
}
