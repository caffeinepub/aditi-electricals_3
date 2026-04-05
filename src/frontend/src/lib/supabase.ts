// Supabase REST client — credentials hardcoded for cross-device login
// Uses plain async functions and factory objects (no Promise subclassing)

export const supabaseUrl = "https://qxfabmlkwtsukoegavpa.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZmFibWxrd3RzdWtvZWdhdnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDg3MjMsImV4cCI6MjA5MDg4NDcyM30.OIrHqPfZZY9pFNo7ygMZtzLkmR2FH_XoL23s_jJm1lc";

const BASE_URL = supabaseUrl;
const ANON_KEY = supabaseAnonKey;

export const isLocalOnlyMode = false;

export type DbError = { message: string; code?: string } | null;
export type DbResult<T> = { data: T | null; error: DbError };

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    ...extra,
  };
}

async function doFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<DbResult<T>> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ message: res.statusText, code: String(res.status) }));
      if (res.status === 406 || err?.code === "PGRST116") {
        return {
          data: null,
          error: { message: "Row not found", code: "PGRST116" },
        };
      }
      return {
        data: null,
        error: { message: err?.message || res.statusText, code: err?.code },
      };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Network error" },
    };
  }
}

type OrderOpts = { ascending?: boolean };
type EqPair = { col: string; value: unknown };

interface SelectState {
  table: string;
  cols: string;
  eqs: EqPair[];
  neqs: EqPair[];
  orderCol?: string;
  orderAsc: boolean;
  limitVal?: number;
  gtes: EqPair[];
  ltes: EqPair[];
}

function buildSelectUrl(s: SelectState): string {
  const params: string[] = [`select=${encodeURIComponent(s.cols)}`];
  for (const { col, value } of s.eqs) params.push(`${col}=eq.${value}`);
  for (const { col, value } of s.neqs) params.push(`${col}=neq.${value}`);
  for (const { col, value } of s.gtes) params.push(`${col}=gte.${value}`);
  for (const { col, value } of s.ltes) params.push(`${col}=lte.${value}`);
  if (s.orderCol) {
    params.push(`order=${s.orderCol}.${s.orderAsc ? "asc" : "desc"}`);
  }
  if (s.limitVal !== undefined) params.push(`limit=${s.limitVal}`);
  return `${BASE_URL}/rest/v1/${s.table}?${params.join("&")}`;
}

// Returns a builder object that is also a Promise<DbResult<T[]>>
function makeSelectBuilder<T>(state: SelectState): Promise<DbResult<T[]>> & {
  select(cols: string): ReturnType<typeof makeSelectBuilder<T>>;
  eq(col: string, value: unknown): ReturnType<typeof makeSelectBuilder<T>>;
  neq(col: string, value: unknown): ReturnType<typeof makeSelectBuilder<T>>;
  order(col: string, opts?: OrderOpts): ReturnType<typeof makeSelectBuilder<T>>;
  limit(n: number): ReturnType<typeof makeSelectBuilder<T>>;
  gte(col: string, value: unknown): ReturnType<typeof makeSelectBuilder<T>>;
  lte(col: string, value: unknown): ReturnType<typeof makeSelectBuilder<T>>;
  single(): Promise<DbResult<T>>;
  maybeSingle(): Promise<DbResult<T | null>>;
} {
  // The base promise executes the array fetch
  const basePromise: Promise<DbResult<T[]>> = doFetch<T[]>(
    buildSelectUrl(state),
    { headers: buildHeaders() },
  );

  const builder = Object.assign(basePromise, {
    select(cols: string) {
      return makeSelectBuilder<T>({ ...state, cols });
    },
    eq(col: string, value: unknown) {
      return makeSelectBuilder<T>({
        ...state,
        eqs: [...state.eqs, { col, value }],
      });
    },
    neq(col: string, value: unknown) {
      return makeSelectBuilder<T>({
        ...state,
        neqs: [...state.neqs, { col, value }],
      });
    },
    order(col: string, opts?: OrderOpts) {
      return makeSelectBuilder<T>({
        ...state,
        orderCol: col,
        orderAsc: opts?.ascending !== false,
      });
    },
    limit(n: number) {
      return makeSelectBuilder<T>({ ...state, limitVal: n });
    },
    gte(col: string, value: unknown) {
      return makeSelectBuilder<T>({
        ...state,
        gtes: [...state.gtes, { col, value }],
      });
    },
    lte(col: string, value: unknown) {
      return makeSelectBuilder<T>({
        ...state,
        ltes: [...state.ltes, { col, value }],
      });
    },
    async single(): Promise<DbResult<T>> {
      const url = buildSelectUrl(state);
      return doFetch<T>(url, {
        headers: buildHeaders({ Accept: "application/vnd.pgrst.object+json" }),
      });
    },
    async maybeSingle(): Promise<DbResult<T | null>> {
      const url = buildSelectUrl(state);
      const result = await doFetch<T>(url, {
        headers: buildHeaders({ Accept: "application/vnd.pgrst.object+json" }),
      });
      if (result.error?.code === "PGRST116") {
        return { data: null, error: null };
      }
      return result as DbResult<T | null>;
    },
  });

  return builder;
}

interface MutateState {
  table: string;
  method: string;
  body: unknown;
  onConflict?: string;
  eqs: EqPair[];
  doSelect: boolean;
  returnMode: "array" | "single" | "none";
}

async function executeMutate<T>(s: MutateState): Promise<DbResult<T>> {
  const filters = s.eqs.map(({ col, value }) => `${col}=eq.${value}`);
  if (s.onConflict) filters.push(`on_conflict=${s.onConflict}`);
  const url = `${BASE_URL}/rest/v1/${s.table}${
    filters.length ? `?${filters.join("&")}` : ""
  }`;
  const prefer: string[] = [];
  if (s.onConflict && s.method === "POST")
    prefer.push("resolution=merge-duplicates");
  if (s.doSelect || s.returnMode !== "none")
    prefer.push("return=representation");
  return doFetch<T>(url, {
    method: s.method,
    headers: buildHeaders({
      "Content-Type": "application/json",
      ...(prefer.length ? { Prefer: prefer.join(",") } : {}),
    }),
    body: s.body !== undefined ? JSON.stringify(s.body) : undefined,
  });
}

function makeMutateBuilder<T = Record<string, unknown>>(
  state: MutateState,
): Promise<DbResult<T>> & {
  eq(col: string, value: unknown): ReturnType<typeof makeMutateBuilder<T>>;
  select(): ReturnType<typeof makeMutateBuilder<T>>;
  single(): Promise<DbResult<T>>;
} {
  const basePromise: Promise<DbResult<T>> = executeMutate<T>(state);

  const builder = Object.assign(basePromise, {
    eq(col: string, value: unknown) {
      return makeMutateBuilder<T>({
        ...state,
        eqs: [...state.eqs, { col, value }],
      });
    },
    select() {
      return makeMutateBuilder<T>({
        ...state,
        doSelect: true,
        returnMode: "array",
      });
    },
    async single(): Promise<DbResult<T>> {
      return executeMutate<T>({
        ...state,
        doSelect: true,
        returnMode: "single",
      });
    },
  });

  return builder;
}

export const supabase = {
  from<T = Record<string, unknown>>(table: string) {
    return {
      select(cols = "*") {
        return makeSelectBuilder<T>({
          table,
          cols,
          eqs: [],
          neqs: [],
          orderAsc: true,
          gtes: [],
          ltes: [],
        });
      },
      insert(data: unknown) {
        return makeMutateBuilder<T>({
          table,
          method: "POST",
          body: data,
          eqs: [],
          doSelect: false,
          returnMode: "none",
        });
      },
      upsert(data: unknown, opts?: { onConflict?: string }) {
        return makeMutateBuilder<T>({
          table,
          method: "POST",
          body: data,
          onConflict: opts?.onConflict,
          eqs: [],
          doSelect: false,
          returnMode: "none",
        });
      },
      update(data: unknown) {
        return makeMutateBuilder<T>({
          table,
          method: "PATCH",
          body: data,
          eqs: [],
          doSelect: false,
          returnMode: "none",
        });
      },
      delete() {
        return makeMutateBuilder<T>({
          table,
          method: "DELETE",
          body: undefined,
          eqs: [],
          doSelect: false,
          returnMode: "none",
        });
      },
    };
  },
};

// Helper mappers
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
