# Specification

## Summary
**Goal:** Fix the owner role authorization bug, restore a clean light blue/white UI theme, and remove the logo from the header.

**Planned changes:**
- Change all backend authorization checks from `role === "admin"` to `role === "owner"` so OWNER001 is recognized as super-admin with full access
- Fix the frontend auth context to store and check `role === "owner"` consistently after OWNER001 login
- Replace dark blue gradients and dark backgrounds with a light blue/white theme: light blue header, white page backgrounds, white cards with subtle shadows, clean typography
- Remove all logo images, icons, and circular logo elements from the header; display only the plain text "Aditi Electricals"

**User-visible outcome:** Logging in as OWNER001 grants full owner access without any "Unauthorized" errors, the app displays a clean light blue and white UI with no dark gradients, and the header shows only the text "Aditi Electricals" with no logo or icon.
