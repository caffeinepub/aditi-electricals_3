// Minimal Supabase REST client — no external package required

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === "undefined") {
  console.error("VITE_SUPABASE_URL is not set.");
}
if (!supabaseAnonKey || supabaseAnonKey === "undefined") {
  console.error("VITE_SUPABASE_ANON_KEY is not set.");
}

const BASE_URL = supabaseUrl || "https://placeholder.supabase.co";
const ANON_KEY = supabaseAnonKey || "placeholder";

// True when the app is running in local-only mode (no real Supabase configured)
export const isLocalOnlyMode =
  !supabaseUrl ||
  supabaseUrl === "undefined" ||
  supabaseUrl.includes("placeholder");

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

// SelectQuery extends Promise so it is awaitable without defining `then` manually
class SelectQuery<T> extends Promise<DbResult<T[]>> {
  private _table: string;
  private _cols: string;
  private _eqs: EqPair[];
  private _neqs: EqPair[];
  private _orderCol: string | undefined;
  private _orderAsc: boolean;
  private _mode: "array" | "single" | "maybeSingle";
  private _limitVal: number | undefined;
  private _gtes: EqPair[];
  private _ltes: EqPair[];
  private _resolve!: (v: DbResult<T[]>) => void;

  constructor(
    table: string,
    cols = "*",
    eqs: EqPair[] = [],
    neqs: EqPair[] = [],
    orderCol?: string,
    orderAsc = true,
    mode: "array" | "single" | "maybeSingle" = "array",
    limitVal?: number,
    gtes: EqPair[] = [],
    ltes: EqPair[] = [],
  ) {
    let res!: (v: DbResult<T[]>) => void;
    super((resolve) => {
      res = resolve;
    });
    this._table = table;
    this._cols = cols;
    this._eqs = eqs;
    this._neqs = neqs;
    this._orderCol = orderCol;
    this._orderAsc = orderAsc;
    this._mode = mode;
    this._limitVal = limitVal;
    this._gtes = gtes;
    this._ltes = ltes;
    this._resolve = res;
    // Schedule execution
    Promise.resolve().then(() => this._run().then(this._resolve));
  }

  private _clone(
    overrides: Partial<{
      cols: string;
      eqs: EqPair[];
      neqs: EqPair[];
      orderCol: string;
      orderAsc: boolean;
      mode: "array" | "single" | "maybeSingle";
      limitVal: number;
      gtes: EqPair[];
      ltes: EqPair[];
    }>,
  ): SelectQuery<T> {
    return new SelectQuery<T>(
      this._table,
      overrides.cols ?? this._cols,
      overrides.eqs ?? this._eqs,
      overrides.neqs ?? this._neqs,
      overrides.orderCol ?? this._orderCol,
      overrides.orderAsc ?? this._orderAsc,
      overrides.mode ?? this._mode,
      overrides.limitVal ?? this._limitVal,
      overrides.gtes ?? this._gtes,
      overrides.ltes ?? this._ltes,
    );
  }

  select(cols = "*"): SelectQuery<T> {
    return this._clone({ cols });
  }

  eq(col: string, value: unknown): SelectQuery<T> {
    return this._clone({ eqs: [...this._eqs, { col, value }] });
  }

  neq(col: string, value: unknown): SelectQuery<T> {
    return this._clone({ neqs: [...this._neqs, { col, value }] });
  }

  order(col: string, opts?: OrderOpts): SelectQuery<T> {
    return this._clone({
      orderCol: col,
      orderAsc: opts?.ascending !== false,
    });
  }

  single(): Promise<DbResult<T>> {
    return this._clone({ mode: "single" }) as unknown as Promise<DbResult<T>>;
  }

  maybeSingle(): Promise<DbResult<T | null>> {
    return this._clone({ mode: "maybeSingle" }) as unknown as Promise<
      DbResult<T | null>
    >;
  }

  limit(n: number): SelectQuery<T> {
    return this._clone({ limitVal: n });
  }

  gte(col: string, value: unknown): SelectQuery<T> {
    return this._clone({ gtes: [...this._gtes, { col, value }] });
  }

  lte(col: string, value: unknown): SelectQuery<T> {
    return this._clone({ ltes: [...this._ltes, { col, value }] });
  }

  private _run(): Promise<DbResult<T[]>> {
    const params: string[] = [`select=${encodeURIComponent(this._cols)}`];
    for (const { col, value } of this._eqs) params.push(`${col}=eq.${value}`);
    for (const { col, value } of this._neqs) params.push(`${col}=neq.${value}`);
    for (const { col, value } of this._gtes) params.push(`${col}=gte.${value}`);
    for (const { col, value } of this._ltes) params.push(`${col}=lte.${value}`);
    if (this._orderCol) {
      params.push(`order=${this._orderCol}.${this._orderAsc ? "asc" : "desc"}`);
    }
    if (this._limitVal !== undefined) {
      params.push(`limit=${this._limitVal}`);
    }
    const url = `${BASE_URL}/rest/v1/${this._table}?${params.join("&")}`;
    const isSingle = this._mode !== "array";
    const h = buildHeaders(
      isSingle ? { Accept: "application/vnd.pgrst.object+json" } : undefined,
    );
    return doFetch<T[]>(url, { headers: h });
  }
}

// MutateQuery extends Promise so it is awaitable
class MutateQuery<T = Record<string, unknown>> extends Promise<DbResult<T>> {
  private _table: string;
  private _method: string;
  private _body: unknown;
  private _onConflict: string | undefined;
  private _eqs: EqPair[];
  private _doSelect: boolean;
  private _mode: "array" | "single" | "none";
  private _resolve!: (v: DbResult<T>) => void;

  constructor(
    table: string,
    method: string,
    body: unknown,
    onConflict?: string,
    eqs: EqPair[] = [],
    doSelect = false,
    mode: "array" | "single" | "none" = "none",
  ) {
    let res!: (v: DbResult<T>) => void;
    super((resolve) => {
      res = resolve;
    });
    this._table = table;
    this._method = method;
    this._body = body;
    this._onConflict = onConflict;
    this._eqs = eqs;
    this._doSelect = doSelect;
    this._mode = mode;
    this._resolve = res;
    Promise.resolve().then(() => this._run().then(this._resolve));
  }

  private _clone(
    overrides: Partial<{
      eqs: EqPair[];
      doSelect: boolean;
      mode: "array" | "single" | "none";
    }>,
  ): MutateQuery<T> {
    return new MutateQuery<T>(
      this._table,
      this._method,
      this._body,
      this._onConflict,
      overrides.eqs ?? this._eqs,
      overrides.doSelect ?? this._doSelect,
      overrides.mode ?? this._mode,
    );
  }

  eq(col: string, value: unknown): MutateQuery<T> {
    return this._clone({ eqs: [...this._eqs, { col, value }] });
  }

  select(): MutateQuery<T> {
    return this._clone({ doSelect: true, mode: "array" });
  }

  single(): Promise<DbResult<T>> {
    return this._clone({ doSelect: true, mode: "single" });
  }

  private _run(): Promise<DbResult<T>> {
    const filters = this._eqs.map(({ col, value }) => `${col}=eq.${value}`);
    if (this._onConflict) filters.push(`on_conflict=${this._onConflict}`);
    const url = `${BASE_URL}/rest/v1/${this._table}${filters.length ? `?${filters.join("&")}` : ""}`;
    const prefer: string[] = [];
    if (this._onConflict && this._method === "POST") {
      prefer.push("resolution=merge-duplicates");
    }
    if (this._doSelect || this._mode !== "none") {
      prefer.push("return=representation");
    }
    return doFetch<T>(url, {
      method: this._method,
      headers: buildHeaders({
        "Content-Type": "application/json",
        ...(prefer.length ? { Prefer: prefer.join(",") } : {}),
      }),
      body: this._body !== undefined ? JSON.stringify(this._body) : undefined,
    });
  }
}

export const supabase = {
  from<T = Record<string, unknown>>(table: string) {
    return {
      select(cols = "*"): SelectQuery<T> {
        return new SelectQuery<T>(table, cols);
      },
      insert(data: unknown): MutateQuery<T> {
        return new MutateQuery<T>(table, "POST", data);
      },
      upsert(data: unknown, opts?: { onConflict?: string }): MutateQuery<T> {
        return new MutateQuery<T>(table, "POST", data, opts?.onConflict);
      },
      update(data: unknown): MutateQuery<T> {
        return new MutateQuery<T>(table, "PATCH", data);
      },
      delete(): MutateQuery<T> {
        return new MutateQuery<T>(table, "DELETE", undefined);
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
