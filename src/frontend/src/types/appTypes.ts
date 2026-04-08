// App domain types for Aditi Electricals
// Used across all components — imports from here instead of backend.ts

// ---- ExternalBlob (file/image handling) ----
export class ExternalBlob {
  directURL: string;
  private _blob?: Uint8Array | null;
  onProgress?: (percentage: number) => void = undefined;

  private constructor(directURL: string, blob: Uint8Array | null) {
    this.directURL = directURL;
    if (blob) this._blob = blob;
  }

  static fromURL(url: string): ExternalBlob {
    return new ExternalBlob(url, null);
  }

  static fromBytes(blob: Uint8Array): ExternalBlob {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array(blob)], { type: "application/octet-stream" }),
    );
    return new ExternalBlob(url, blob);
  }

  public async getBytes(): Promise<Uint8Array> {
    if (this._blob) return this._blob;
    const response = await fetch(this.directURL);
    const b = await response.blob();
    this._blob = new Uint8Array(await b.arrayBuffer());
    return this._blob;
  }

  public getDirectURL(): string {
    return this.directURL;
  }

  public withUploadProgress(
    onProgress: (percentage: number) => void,
  ): ExternalBlob {
    this.onProgress = onProgress;
    return this;
  }
}

// ---- Enums ----
export type AttendanceStatus = "present" | "absent" | "leave" | "holiday";

// biome-ignore lint: AttendanceStatus object used as enum
export const AttendanceStatus = {
  present: "present" as AttendanceStatus,
  absent: "absent" as AttendanceStatus,
  leave: "leave" as AttendanceStatus,
  holiday: "holiday" as AttendanceStatus,
};

// NoteType used as both a type and enum-like object
export type NoteType =
  | "work"
  | "material"
  | "ownerInstruction"
  | "perWorker"
  | "workNote"
  | "materialNote"
  | "general";

// biome-ignore lint: NoteType object used as enum
export const NoteType = {
  work: "work" as NoteType,
  material: "material" as NoteType,
  ownerInstruction: "ownerInstruction" as NoteType,
  perWorker: "perWorker" as NoteType,
  workNote: "workNote" as NoteType,
  materialNote: "materialNote" as NoteType,
  general: "general" as NoteType,
};

// ---- Domain interfaces ----
export interface Worker {
  workerId: string;
  name: string;
  mobile: string;
  monthlySalary: bigint;
  pin: string;
  active: boolean;
  role: string;
}

export interface AttendanceRecord {
  recordId: string;
  workerId: string;
  date: string;
  status: AttendanceStatus | string;
  latitude?: number;
  longitude?: number;
  markedBy: string;
  timestamp: bigint;
  photo?: ExternalBlob | null;
}

export interface AttendanceRecordPublic {
  recordId: string;
  workerId: string;
  date: string;
  status: AttendanceStatus | string;
  markedBy: string;
  timestamp: bigint;
}

export interface Holiday {
  holidayId: string;
  date: string;
  name: string;
  description?: string;
  createdAt: bigint;
}

export interface Note {
  noteId: string;
  workerId: string;
  noteType: NoteType | string;
  content: string;
  createdBy: string;
  createdAt: bigint;
  updatedAt?: bigint;
  photoUrl?: { getDirectURL: () => string } | null;
}

export interface SalaryRecord {
  salaryId: string;
  workerId: string;
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
  announcementId: string;
  title: string;
  content: string;
  createdAt: bigint;
}

export interface WorkConfirmation {
  confirmationId: string;
  workerId: string;
  date: string;
  confirmed: boolean;
  confirmedAt?: bigint;
}
