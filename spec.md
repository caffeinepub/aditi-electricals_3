# Aditi Electricals

## Current State
- App uses Supabase as backend when env vars are set; falls back to `localStorage` (localDb) when Supabase is not configured
- The cross-device login bug: workers added on one device are stored in `localStorage` (device-local), making them invisible on other devices — the fallback path is the bug
- Salary records store a single `advance_amount` and `carry_forward` field (not multi-entry)
- Attendance edit/delete is already implemented in `AttendanceManagement.tsx` using `useOwnerUpdateAttendance` and `useOwnerDeleteAttendance` hooks — these hooks need to work in Supabase mode

## Requested Changes (Diff)

### Add
- `advance_entries` table support: `{id, worker_id, salary_record_id, amount, date, time, created_at}` — multiple entries per worker per month
- `carry_forward_entries` table support: `{id, worker_id, salary_record_id, amount, date, time, created_at}` — multiple entries per worker per month
- localDb: `localAdvanceEntries` and `localCarryForwardEntries` tables for offline fallback
- In `SalaryManagement.tsx`: UI to add advance entries (auto or manual date/time), list all advance entries, delete entries, show totals
- In `SalaryManagement.tsx`: UI to add carry forward entries (auto or manual date/time), list all carry forward entries, delete entries, show totals
- Hooks: `useGetAdvanceEntries`, `useAddAdvanceEntry`, `useDeleteAdvanceEntry`, `useGetCarryForwardEntries`, `useAddCarryForwardEntry`, `useDeleteCarryForwardEntry`
- Updated `SUPABASE_SETUP.md` with SQL for new tables

### Modify
- `AuthContext.tsx` login function: **Remove the `isSupabaseConfigured()` guard** — always attempt Supabase. Only fall back to localDb if Supabase returns a network/connection error (not a "not configured" state). This is the critical cross-device fix: workers must ALWAYS be read from Supabase, not localStorage.
- `SalaryManagement.tsx`: Replace single `advanceAmountStr` + `carryForwardStr` fields with multi-entry UI. Salary calculation uses `sum(advance_entries)` and `sum(carry_forward_entries)` instead of single values. Still save the sum to `advance_amount` / `carry_forward` in `salary_records` for backwards compatibility.
- `useQueries.ts` hooks: `useAddSalaryRecord`, `useUpdateSalaryRecord` — calculate totals from entries and store sum in `salary_records`
- `AttendanceManagement.tsx`: Confirm delete button is shown for owner, using `useOwnerDeleteAttendance`. Ensure delete works in both Supabase and localDb mode.

### Remove
- Remove fallback to `localWorkers` for authentication when Supabase URL/key are set (even partially). Authentication MUST use Supabase only.

## Implementation Plan
1. Fix `AuthContext.tsx` login: always use Supabase path; only use localDb if `supabaseUrl` is literally missing/placeholder
2. Add `localAdvanceEntries` and `localCarryForwardEntries` to `localDb.ts`
3. Add `mapAdvanceEntry` and `mapCarryForwardEntry` helper mappers to `supabase.ts`
4. Add 6 new hooks in `useQueries.ts` for advance/carry-forward entries
5. Rewrite `SalaryManagement.tsx` to show entry lists, add entry forms (with auto/manual datetime), delete buttons, and compute totals from entries
6. Ensure `useOwnerDeleteAttendance` and `useOwnerUpdateAttendance` hooks work (already implemented — verify Supabase path)
7. Update `SUPABASE_SETUP.md` with SQL for `advance_entries` and `carry_forward_entries` tables
