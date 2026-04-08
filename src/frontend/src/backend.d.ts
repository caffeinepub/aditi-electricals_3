import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Note {
    workerId: WorkerId;
    content: string;
    noteId: NoteId;
    createdAt: Time;
    createdBy: string;
    noteType: NoteType;
    photoUrl?: ExternalBlob;
    updatedAt?: Time;
}
export interface SalaryRecord {
    month: bigint;
    workerId: WorkerId;
    presentDays: bigint;
    year: bigint;
    netPay: bigint;
    manualOverride: boolean;
    monthlySalary: bigint;
    carryForward: bigint;
    advanceAmount: bigint;
    absentDays: bigint;
    companyHolidays: bigint;
    salaryId: SalaryId;
    cutDays: bigint;
}
export type Time = bigint;
export type NoteId = string;
export interface MonthlySummaryEntry {
    workerId: WorkerId;
    presentDays: bigint;
    absentDays: bigint;
    leaveDays: bigint;
    workerName: string;
}
export type SalaryId = string;
export type ConfirmationId = string;
export interface TwoPMConfirmation {
    workerId: WorkerId;
    confirmationId: ConfirmationId;
    date: string;
    confirmedAt?: Time;
    confirmed: boolean;
}
export interface AttendanceRecordPublic {
    status: AttendanceStatus;
    workerId: WorkerId;
    date: string;
    markedBy: string;
    timestamp: Time;
    recordId: AttendanceId;
    photo?: ExternalBlob;
}
export type AttendanceId = string;
export interface DashboardStats {
    todayAbsent: bigint;
    totalWorkers: bigint;
    todayPresent: bigint;
    twoPMConfirmations: bigint;
}
export interface Announcement {
    title: string;
    content: string;
    createdAt: Time;
    announcementId: AnnouncementId;
}
export type AnnouncementId = string;
export type WorkerId = string;
export interface AttendanceRecord {
    status: AttendanceStatus;
    latitude?: number;
    workerId: WorkerId;
    date: string;
    markedBy: string;
    longitude?: number;
    timestamp: Time;
    recordId: AttendanceId;
    photo?: ExternalBlob;
}
export interface Holiday {
    date: string;
    name: string;
    createdAt: Time;
    description?: string;
    holidayId: HolidayId;
}
export interface Worker {
    pin: string;
    workerId: WorkerId;
    active: boolean;
    name: string;
    monthlySalary: bigint;
    mobile: string;
}
export interface UserProfile {
    workerId?: string;
    name: string;
    role: string;
}
export type HolidayId = string;
export enum AttendanceStatus {
    present = "present",
    leave = "leave",
    absent = "absent",
    holiday = "holiday"
}
export enum NoteType {
    work = "work",
    perWorker = "perWorker",
    ownerInstruction = "ownerInstruction",
    material = "material"
}
export interface backendInterface {
    addAnnouncement(title: string, content: string): Promise<AnnouncementId>;
    addHoliday(date: string, name: string, description: string | null): Promise<HolidayId>;
    addNote(workerId: WorkerId, noteType: NoteType, content: string, photoUrl: ExternalBlob | null): Promise<NoteId>;
    addSalaryRecord(workerId: WorkerId, month: bigint, year: bigint, monthlySalary: bigint, presentDays: bigint, absentDays: bigint, cutDays: bigint, advanceAmount: bigint, carryForward: bigint, companyHolidays: bigint): Promise<SalaryId>;
    addWorker(name: string, mobile: string, monthlySalary: bigint): Promise<WorkerId>;
    changeMyPin(currentPin: string, newPin: string): Promise<void>;
    changeWorkerPin(workerId: WorkerId, newPin: string): Promise<void>;
    confirmTwoPM(workerId: WorkerId): Promise<ConfirmationId>;
    deleteAnnouncement(announcementId: AnnouncementId): Promise<void>;
    deleteHoliday(holidayId: HolidayId): Promise<void>;
    deleteNote(noteId: NoteId): Promise<void>;
    deleteSalaryRecord(salaryId: SalaryId): Promise<void>;
    deleteWorker(workerId: WorkerId): Promise<void>;
    editHoliday(holidayId: HolidayId, date: string, name: string, description: string | null): Promise<void>;
    editWorker(workerId: WorkerId, name: string, mobile: string, monthlySalary: bigint, pin: string, active: boolean): Promise<void>;
    getAllAnnouncements(): Promise<Array<Announcement>>;
    getAllHolidays(): Promise<Array<Holiday>>;
    getAllNotes(): Promise<Array<Note>>;
    getAllSalaryRecords(): Promise<Array<SalaryRecord>>;
    getAllWorkers(): Promise<Array<Worker>>;
    getAttendanceByDate(workerId: WorkerId, date: string): Promise<AttendanceRecordPublic | null>;
    getAttendanceByWorker(workerId: WorkerId): Promise<Array<AttendanceRecordPublic>>;
    getAttendanceByWorkerForMonth(workerId: WorkerId, month: bigint, year: bigint): Promise<Array<AttendanceRecordPublic>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getConfirmationsByDate(date: string): Promise<Array<TwoPMConfirmation>>;
    getDashboardStats(): Promise<DashboardStats>;
    getMonthlySummary(month: bigint, year: bigint): Promise<Array<MonthlySummaryEntry>>;
    getMyConfirmation(workerId: WorkerId, date: string): Promise<TwoPMConfirmation | null>;
    getMyNotes(): Promise<Array<Note>>;
    getNotesByType(noteType: NoteType): Promise<Array<Note>>;
    getNotesByWorker(workerId: WorkerId): Promise<Array<Note>>;
    getOwnerStatus(): Promise<{
        ownerRegistered: boolean;
        isOwner: boolean;
    }>;
    getSalaryRecord(workerId: WorkerId, month: bigint, year: bigint): Promise<SalaryRecord | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorker(workerId: WorkerId): Promise<Worker>;
    linkWorkerPrincipal(workerId: WorkerId): Promise<void>;
    markAttendance(workerId: WorkerId, status: AttendanceStatus, latitude: number | null, longitude: number | null, photo: ExternalBlob | null): Promise<AttendanceId>;
    ownerAddAttendance(workerId: WorkerId, date: string, status: AttendanceStatus): Promise<AttendanceId>;
    ownerDeleteAttendance(recordId: AttendanceId): Promise<void>;
    ownerGetAttendanceByDate(workerId: WorkerId, date: string): Promise<AttendanceRecord | null>;
    ownerGetAttendanceByWorkerForMonth(workerId: WorkerId, month: bigint, year: bigint): Promise<Array<AttendanceRecord>>;
    ownerGetAttendanceForDate(date: string): Promise<Array<AttendanceRecord>>;
    ownerUpdateAttendance(recordId: AttendanceId, status: AttendanceStatus): Promise<void>;
    registerOwner(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transferOwnership(newOwner: Principal): Promise<void>;
    updateAnnouncement(announcementId: AnnouncementId, title: string, content: string): Promise<void>;
    updateHoliday(holidayId: HolidayId, date: string, name: string, description: string | null): Promise<void>;
    updateNote(noteId: NoteId, content: string, photoUrl: ExternalBlob | null): Promise<void>;
    updateSalaryRecord(salaryId: SalaryId, monthlySalary: bigint, presentDays: bigint, absentDays: bigint, cutDays: bigint, advanceAmount: bigint, carryForward: bigint, companyHolidays: bigint, manualOverride: boolean, overrideNetPay: bigint | null): Promise<void>;
    updateWorker(workerId: WorkerId, name: string, mobile: string, monthlySalary: bigint, pin: string, active: boolean): Promise<void>;
    validateWorkerLogin(workerId: WorkerId, pin: string): Promise<{
        workerId: WorkerId;
        name: string;
        role: string;
    } | null>;
}
