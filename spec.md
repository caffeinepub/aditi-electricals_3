# Aditi Electricals

## Current State
- Attendance marking already captures GPS at mark time (latitude/longitude saved in attendance table)
- `isWithinAttendanceWindow()` exists in dateUtils but is only used as a soft check; attendance can still be submitted outside window
- Notifications exist for 9:30 AM and 2:00 PM only
- Owner AttendanceManagement page shows GPS for check-in attendance records
- No evening (4 PM) location capture exists
- No 8:55 AM reminder or 3:55 PM owner notification

## Requested Changes (Diff)

### Add
1. **Evening location capture** — At 4:00 PM, worker app automatically requests GPS and saves a location record (worker_id, date, latitude, longitude, timestamp) to a new `evening_locations` table in Supabase / `aditi_db_evening_locations` in localStorage.
2. **Location permission request** — Ask for geolocation permission on first use (before first attendance mark or evening capture); show a clear prompt if denied.
3. **3:55 PM notification** — Owner receives: "It's time to check worker locations"
4. **8:55 AM notification** — All users receive: "Attendance will open in 5 minutes"
5. **Owner Evening Locations view** — In AttendanceManagement (or a new tab), show worker evening locations on map with date & time. Reuse existing LocationPreview and map pattern.
6. **EveningLocationsMap component** — Shows all workers' evening locations for a selected date with name, time, and Google Maps link.

### Modify
1. **Attendance time window enforcement** — `handleConfirmAttendance` and `handleStartMarkAttendance` in WorkerAttendance.tsx must hard-block submission outside 9:00–9:30 AM window. Show clear error message. Button disabled outside window.
2. **notifications.ts** — Add `msUntilTime(8, 55)` for attendance-open reminder and `msUntilTime(15, 55)` for owner location-check reminder. Reschedule each daily.
3. **localDb.ts** — Add `localEveningLocations` CRUD.
4. **useQueries.ts** — Add `useSaveEveningLocation`, `useGetEveningLocations`, `useGetEveningLocationsByDate` hooks.
5. **WorkerAttendance.tsx** — After checking window, show countdown until 9:00 AM if before, or "window closed" if after 9:30 AM. Also schedule 4 PM location capture.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `localDb.ts` — add `localEveningLocations` CRUD store.
2. Update `useQueries.ts` — add evening location hooks (save + get).
3. Update `notifications.ts` — add 8:55 AM and 3:55 PM scheduled notifications.
4. Update `WorkerAttendance.tsx` — hard-block attendance outside 9–9:30 AM, schedule 4 PM auto-capture.
5. Create `EveningLocationsMap.tsx` — owner view of evening locations by date.
6. Update `AttendanceManagement.tsx` — add a tab/section for evening locations.
7. Update `SUPABASE_SETUP.md` — add `evening_locations` table SQL.
