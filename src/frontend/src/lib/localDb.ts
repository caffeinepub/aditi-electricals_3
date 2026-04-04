// localStorage-based fallback database (used when Supabase is not configured)

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  return !!(
    url &&
    url !== "undefined" &&
    !url.includes("placeholder") &&
    key &&
    key !== "undefined" &&
    key !== "placeholder"
  );
}

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const DB_PREFIX = "aditi_db_";

function getTable<T>(name: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(DB_PREFIX + name) || "[]") as T[];
  } catch {
    return [];
  }
}

function setTable<T>(name: string, data: T[]): void {
  localStorage.setItem(DB_PREFIX + name, JSON.stringify(data));
}

function initDefaults() {
  const workers = getTable<Record<string, unknown>>("workers");
  if (workers.length === 0) {
    setTable("workers", [
      {
        worker_id: "OWNER001",
        name: "Owner",
        mobile: "",
        monthly_salary: 0,
        pin: "1234",
        role: "owner",
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        worker_id: "OWNER1",
        name: "Owner",
        mobile: "",
        monthly_salary: 0,
        pin: "1234",
        role: "owner",
        active: true,
        created_at: new Date().toISOString(),
      },
      {
        worker_id: "W001",
        name: "Worker One",
        mobile: "",
        monthly_salary: 15000,
        pin: "1234",
        role: "worker",
        active: true,
        created_at: new Date().toISOString(),
      },
    ]);
  }
}

initDefaults();

// --- Workers ---
export const localWorkers = {
  getAll(): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("workers").filter(
      (w) => w.role !== "owner",
    );
  },
  getById(workerId: string): Record<string, unknown> | null {
    return (
      getTable<Record<string, unknown>>("workers").find(
        (w) => w.worker_id === workerId,
      ) || null
    );
  },
  getByIdForLogin(workerId: string): Record<string, unknown> | null {
    return (
      getTable<Record<string, unknown>>("workers").find(
        (w) => (w.worker_id as string).toUpperCase() === workerId.toUpperCase(),
      ) || null
    );
  },
  insert(data: Record<string, unknown>): Record<string, unknown> {
    const workers = getTable<Record<string, unknown>>("workers");
    const record = { ...data, created_at: new Date().toISOString() };
    workers.push(record);
    setTable("workers", workers);
    return record;
  },
  update(workerId: string, data: Record<string, unknown>): void {
    const workers = getTable<Record<string, unknown>>("workers");
    const idx = workers.findIndex((w) => w.worker_id === workerId);
    if (idx !== -1) {
      workers[idx] = { ...workers[idx], ...data };
      setTable("workers", workers);
    }
  },
  delete(workerId: string): void {
    setTable(
      "workers",
      getTable<Record<string, unknown>>("workers").filter(
        (w) => w.worker_id !== workerId,
      ),
    );
  },
  nextWorkerId(): string {
    const workers = getTable<Record<string, unknown>>("workers").filter(
      (w) => w.role !== "owner",
    );
    let max = 0;
    for (const w of workers) {
      const n = Number.parseInt((w.worker_id as string).replace("W", ""), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `W${String(max + 1).padStart(3, "0")}`;
  },
};

// --- Attendance ---
export const localAttendance = {
  getAll(): Record<string, unknown>[] {
    return getTable("attendance");
  },
  getByWorker(workerId: string): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("attendance")
      .filter((r) => r.worker_id === workerId)
      .sort((a, b) => (b.date as string).localeCompare(a.date as string));
  },
  getByWorkerMonth(
    workerId: string,
    start: string,
    end: string,
  ): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("attendance").filter(
      (r) =>
        r.worker_id === workerId &&
        (r.date as string) >= start &&
        (r.date as string) <= end,
    );
  },
  getByDate(date: string): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("attendance").filter(
      (r) => r.date === date,
    );
  },
  getByWorkerDate(
    workerId: string,
    date: string,
  ): Record<string, unknown> | null {
    return (
      getTable<Record<string, unknown>>("attendance").find(
        (r) => r.worker_id === workerId && r.date === date,
      ) || null
    );
  },
  upsert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("attendance");
    const existing = records.findIndex(
      (r) => r.worker_id === data.worker_id && r.date === data.date,
    );
    if (existing !== -1) {
      records[existing] = { ...records[existing], ...data };
      setTable("attendance", records);
      return records[existing];
    }
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("attendance", records);
    return record;
  },
  updateById(id: string, data: Record<string, unknown>): void {
    const records = getTable<Record<string, unknown>>("attendance");
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...data };
      setTable("attendance", records);
    }
  },
  deleteById(id: string): void {
    setTable(
      "attendance",
      getTable<Record<string, unknown>>("attendance").filter(
        (r) => r.id !== id,
      ),
    );
  },
};

// --- Holidays ---
export const localHolidays = {
  getAll(): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("holidays").sort((a, b) =>
      (a.date as string).localeCompare(b.date as string),
    );
  },
  insert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("holidays");
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("holidays", records);
    return record;
  },
  update(id: string, data: Record<string, unknown>): void {
    const records = getTable<Record<string, unknown>>("holidays");
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...data };
      setTable("holidays", records);
    }
  },
  delete(id: string): void {
    setTable(
      "holidays",
      getTable<Record<string, unknown>>("holidays").filter((r) => r.id !== id),
    );
  },
};

// --- Notes ---
export const localNotes = {
  getAll(): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("notes").sort((a, b) =>
      (b.created_at as string).localeCompare(a.created_at as string),
    );
  },
  getByWorker(workerId: string): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("notes")
      .filter((r) => r.worker_id === workerId)
      .sort((a, b) =>
        (b.created_at as string).localeCompare(a.created_at as string),
      );
  },
  getForWorker(workerId: string): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("notes")
      .filter(
        (n) => n.worker_id === workerId || n.note_type === "ownerInstruction",
      )
      .sort((a, b) =>
        (b.created_at as string).localeCompare(a.created_at as string),
      );
  },
  insert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("notes");
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("notes", records);
    return record;
  },
  update(id: string, data: Record<string, unknown>): void {
    const records = getTable<Record<string, unknown>>("notes");
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = {
        ...records[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      setTable("notes", records);
    }
  },
  delete(id: string): void {
    setTable(
      "notes",
      getTable<Record<string, unknown>>("notes").filter((r) => r.id !== id),
    );
  },
};

// --- Salary Records ---
export const localSalary = {
  get(
    workerId: string,
    month: number,
    year: number,
  ): Record<string, unknown> | null {
    return (
      getTable<Record<string, unknown>>("salary_records").find(
        (r) => r.worker_id === workerId && r.month === month && r.year === year,
      ) || null
    );
  },
  insert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("salary_records");
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("salary_records", records);
    return record;
  },
  update(id: string, data: Record<string, unknown>): void {
    const records = getTable<Record<string, unknown>>("salary_records");
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...data };
      setTable("salary_records", records);
    }
  },
};

// --- Confirmations ---
export const localConfirmations = {
  getByDate(date: string): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("confirmations").filter(
      (r) => r.date === date,
    );
  },
  getByWorkerDate(
    workerId: string,
    date: string,
  ): Record<string, unknown> | null {
    return (
      getTable<Record<string, unknown>>("confirmations").find(
        (r) => r.worker_id === workerId && r.date === date,
      ) || null
    );
  },
  insert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("confirmations");
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("confirmations", records);
    return record;
  },
};

// --- Announcements ---
export const localAnnouncements = {
  getAll(): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("announcements").sort((a, b) =>
      (b.created_at as string).localeCompare(a.created_at as string),
    );
  },
  insert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("announcements");
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("announcements", records);
    return record;
  },
  update(id: string, data: Record<string, unknown>): void {
    const records = getTable<Record<string, unknown>>("announcements");
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...data };
      setTable("announcements", records);
    }
  },
  delete(id: string): void {
    setTable(
      "announcements",
      getTable<Record<string, unknown>>("announcements").filter(
        (r) => r.id !== id,
      ),
    );
  },
};

// --- Advance Entries ---
export const localAdvanceEntries = {
  getByWorkerMonth(
    workerId: string,
    month: number,
    year: number,
  ): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("advance_entries")
      .filter(
        (r) => r.worker_id === workerId && r.month === month && r.year === year,
      )
      .sort((a, b) =>
        (a.entry_date as string).localeCompare(b.entry_date as string),
      );
  },
  insert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("advance_entries");
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("advance_entries", records);
    return record;
  },
  deleteById(id: string): void {
    setTable(
      "advance_entries",
      getTable<Record<string, unknown>>("advance_entries").filter(
        (r) => r.id !== id,
      ),
    );
  },
};

// --- Carry Forward Entries ---
export const localCarryForwardEntries = {
  getByWorkerMonth(
    workerId: string,
    month: number,
    year: number,
  ): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("carry_forward_entries")
      .filter(
        (r) => r.worker_id === workerId && r.month === month && r.year === year,
      )
      .sort((a, b) =>
        (a.entry_date as string).localeCompare(b.entry_date as string),
      );
  },
  insert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("carry_forward_entries");
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("carry_forward_entries", records);
    return record;
  },
  deleteById(id: string): void {
    setTable(
      "carry_forward_entries",
      getTable<Record<string, unknown>>("carry_forward_entries").filter(
        (r) => r.id !== id,
      ),
    );
  },
};

// --- Evening Locations ---
export const localEveningLocations = {
  getAll(): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("evening_locations");
  },
  getByDate(date: string): Record<string, unknown>[] {
    return getTable<Record<string, unknown>>("evening_locations").filter(
      (r) => r.date === date,
    );
  },
  getByWorkerDate(
    workerId: string,
    date: string,
  ): Record<string, unknown> | null {
    return (
      getTable<Record<string, unknown>>("evening_locations").find(
        (r) => r.worker_id === workerId && r.date === date,
      ) || null
    );
  },
  upsert(data: Record<string, unknown>): Record<string, unknown> {
    const records = getTable<Record<string, unknown>>("evening_locations");
    const existing = records.findIndex(
      (r) => r.worker_id === data.worker_id && r.date === data.date,
    );
    if (existing !== -1) {
      records[existing] = { ...records[existing], ...data };
      setTable("evening_locations", records);
      return records[existing];
    }
    const record = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    records.push(record);
    setTable("evening_locations", records);
    return record;
  },
};
