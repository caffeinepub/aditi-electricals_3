// localDb.ts — stub file. Supabase is the only data source.
// All functions are no-ops kept only to avoid breaking legacy imports.
// isSupabaseConfigured() always returns true — the app never falls back to localStorage.

export function isSupabaseConfigured(): boolean {
  return true;
}

// --- Stub objects (no-ops) ---
// These exist so any remaining import references don't break at compile time.
// They should never be called since isSupabaseConfigured() always returns true.

export const localWorkers = {
  getAll: (): Record<string, unknown>[] => [],
  getById: (_id: string): Record<string, unknown> | null => null,
  getByIdForLogin: (_id: string): Record<string, unknown> | null => null,
  insert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
  update: (_id: string, _data: Record<string, unknown>): void => {},
  delete: (_id: string): void => {},
  nextWorkerId: (): string => "W001",
};

export const localAttendance = {
  getAll: (): Record<string, unknown>[] => [],
  getByWorker: (_id: string): Record<string, unknown>[] => [],
  getByWorkerMonth: (
    _id: string,
    _start: string,
    _end: string,
  ): Record<string, unknown>[] => [],
  getByDate: (_date: string): Record<string, unknown>[] => [],
  getByWorkerDate: (
    _id: string,
    _date: string,
  ): Record<string, unknown> | null => null,
  upsert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
  updateById: (_id: string, _data: Record<string, unknown>): void => {},
  deleteById: (_id: string): void => {},
};

export const localHolidays = {
  getAll: (): Record<string, unknown>[] => [],
  insert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
  update: (_id: string, _data: Record<string, unknown>): void => {},
  delete: (_id: string): void => {},
};

export const localNotes = {
  getAll: (): Record<string, unknown>[] => [],
  getByWorker: (_id: string): Record<string, unknown>[] => [],
  getForWorker: (_id: string): Record<string, unknown>[] => [],
  insert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
  update: (_id: string, _data: Record<string, unknown>): void => {},
  delete: (_id: string): void => {},
};

export const localSalary = {
  get: (
    _wid: string,
    _month: number,
    _year: number,
  ): Record<string, unknown> | null => null,
  insert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
  update: (_id: string, _data: Record<string, unknown>): void => {},
};

export const localConfirmations = {
  getByDate: (_date: string): Record<string, unknown>[] => [],
  getByWorkerDate: (
    _id: string,
    _date: string,
  ): Record<string, unknown> | null => null,
  insert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
};

export const localAnnouncements = {
  getAll: (): Record<string, unknown>[] => [],
  insert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
  update: (_id: string, _data: Record<string, unknown>): void => {},
  delete: (_id: string): void => {},
};

export const localAdvanceEntries = {
  getByWorkerMonth: (
    _id: string,
    _month: number,
    _year: number,
  ): Record<string, unknown>[] => [],
  insert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
  deleteById: (_id: string): void => {},
};

export const localCarryForwardEntries = {
  getByWorkerMonth: (
    _id: string,
    _month: number,
    _year: number,
  ): Record<string, unknown>[] => [],
  insert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
  deleteById: (_id: string): void => {},
};

export const localEveningLocations = {
  getAll: (): Record<string, unknown>[] => [],
  getByDate: (_date: string): Record<string, unknown>[] => [],
  getByWorkerDate: (
    _id: string,
    _date: string,
  ): Record<string, unknown> | null => null,
  upsert: (_data: Record<string, unknown>): Record<string, unknown> => ({}),
};
