# School Management & Maintenance

## Current State
- Role-based system: Teacher, Authority, Admin Staff
- Any user logs in via Internet Identity and sets their own profile (name + role) via RoleSetupPage
- Switch Role button in sidebar lets users freely switch between roles
- Profile save bug: `_initializeAccessControlWithSecret` is not wrapped in try-catch in useActor.ts; if it throws on repeat logins, actor fails to load and all calls (including saveProfile) return "No actor"

## Requested Changes (Diff)

### Add
- **Super Admin role**: A special privileged user (identified as the Caffeine platform admin via `isCallerAdmin`) who can view and manage profiles for all users
- **Backend `getAllUserProfiles()`**: Returns all registered user profiles with their principal IDs (super admin only)
- **Backend `setUserProfileForPrincipal(principal, profile)`**: Allows super admin to create or overwrite a profile for any user
- **Super Admin dashboard page**: Lists all users with their current profiles; allows creating new profiles or editing existing ones (change name and/or role); accessible only when `isCallerAdmin()` is true
- Super Admin sees a "Manage Users" nav item in the sidebar regardless of their current app role

### Modify
- **useActor.ts**: Wrap `_initializeAccessControlWithSecret` in try-catch so initialization errors don't break the actor (fixes persistent "failed to save profile" error)

### Remove
- Nothing removed

## Implementation Plan
1. Fix `useActor.ts`: wrap initialization call in try-catch, always return the actor even if init throws
2. Backend: add `getAllUserProfiles()` (AccessControl admin only) and `setUserProfileForPrincipal(principal, profile)` (AccessControl admin only)
3. Frontend: add `useIsAdmin` hook that calls `isCallerAdmin()`; add `useAllUserProfiles` and `useSetUserProfileForPrincipal` queries
4. Frontend: create `SuperAdminPage.tsx` — table of all users with their name/role, inline edit capability, and a form to add a new user by entering their Principal ID
5. Frontend: In App.tsx, if `isAdmin` is true, show a "Manage Users" link in the sidebar; when that page is active, render `SuperAdminPage`
6. The super admin is whoever holds the Caffeine admin token (first login via admin URL) — no email concept needed
