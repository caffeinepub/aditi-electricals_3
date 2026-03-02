# Specification

## Summary
**Goal:** Fix backend owner authorization so that the authenticated Internet Identity principal is correctly recognized as the owner in all protected backend functions.

**Planned changes:**
- Fix owner role validation in `backend/main.mo` to use structural principal equality (`Principal.equal`) instead of string coercion or indirect comparisons in all protected functions (`addWorker`, `addHoliday`, `markAttendance`, etc.)
- Store the owner principal in a stable variable so it persists across canister upgrades
- Add a safe re-initialization path that allows the first authenticated caller to claim ownership if no owner is currently set, and reject subsequent ownership claims once an owner is recorded
- Ensure the frontend actor is always constructed with the authenticated Internet Identity agent (not anonymous), and add a guard to prevent mutation calls from being dispatched before the actor is fully initialized with the identity

**User-visible outcome:** The owner can successfully perform all protected actions (add workers, add holidays, mark attendance) without receiving "Unauthorized" errors after logging in with their Internet Identity.
