async function fetchDefects() {
    let response = await fetch('http://127.0.0.1:8000/detect_status');
    let data = await response.json();
    console.log("Detections:", data.detections);
}
setInterval(fetchDefects, 1000);# Factory Sight AI - Authentication & RBAC Manual Test Checklist

This checklist documents the end-to-end authentication verification steps for Factory Sight AI.

## 1. Fresh Install & First-Time Bootstrap Admin
- [ ] Clear `localStorage` (`localStorage.clear()`).
- [ ] Navigate to `/login`.
  - **Expected**: "Fresh System Deployment" banner is shown with link to `/register`.
- [ ] Navigate to `/register`.
  - **Expected**: "Bootstrap Administrator Account" banner is displayed.
  - **Expected**: Role assignment is locked to `Plant Director (ADMIN)` and submit button reads "Initialize Administrator Account".
- [ ] Submit with empty name, email, or password.
  - **Expected**: Inline validation error messages appear in red under respective inputs without sending requests.
- [ ] Submit valid Admin registration (`admin@factorysight.ai`, `Password123!`, `Plant Director`).
  - **Expected**: User is authenticated and automatically redirected to `/dashboard`.
  - **Expected**: Header displays `Plant Director` name, `ADMIN` badge, and deterministic initials avatar in top-right corner.

## 2. Admin Capabilities & User Provisioning
- [ ] Navigate to `/workers`.
  - **Expected**: Workers page loads and displays shop floor personnel table with Add/Edit/Delete actions.
- [ ] Navigate to `/settings`.
  - **Expected**: "Personnel & RBAC Role Management" card is visible and displays the registered Admin account.
  - **Expected**: Admin can provision new personnel (`+ Add Personnel`) or modify roles (`OPERATOR`, `ENGINEER`, `ADMIN`).

## 3. Logout & Session Invalidation
- [ ] Click the avatar dropdown in the top-right header and click **Sign Out**.
  - **Expected**: Active session token and user object are cleared from `localStorage`.
  - **Expected**: Browser cleanly navigates back to landing page `/` with zero unhandled errors.

## 4. Subsequent User Registration (Operator & Engineer)
- [ ] Navigate to `/register`.
  - **Expected**: Bootstrap Admin banner is NOT displayed.
  - **Expected**: Operational Role Selector allows choosing between **Operator** and **Engineer** (Admin is excluded).
- [ ] Attempt registration with mismatched passwords (`Password123!` vs `Password999!`).
  - **Expected**: Inline error "Passwords do not match." is displayed.
- [ ] Register an Operator account (`operator@factorysight.ai`, `Password123!`, Role: `OPERATOR`).
  - **Expected**: Redirects to `/dashboard` with `OPERATOR` badge in the header.

## 5. Non-Admin RBAC Route Protection & Privacy
- [ ] As an Operator or Engineer, attempt direct URL navigation to `/workers`.
  - **Expected**: Route-level guard intercepts navigation and automatically redirects user back to `/dashboard`.
- [ ] Navigate to `/settings` as an Operator or Engineer.
  - **Expected**: Personnel & RBAC user roster table is hidden, displaying "User Authorization Scope" informational card instead.

## 6. Login Validation & Error Rejections
- [ ] Sign out and navigate to `/login`.
- [ ] Test Empty Fields: Submit empty form.
  - **Expected**: Inline error "Work email is required." appears.
- [ ] Test Invalid Email Format: Enter `invalid-email-address`.
  - **Expected**: Inline error "Please enter a valid work email address".
- [ ] Test Unregistered Email: Enter `unknown.user@factory.com` + `Password123!`.
  - **Expected**: Clear server error banner: "Invalid email or password. Please verify your credentials or register a new account."
- [ ] Test Wrong Password: Enter registered email + wrong password `WrongPassword999!`.
  - **Expected**: Rejection banner displayed; UI remains intact.
- [ ] Test Valid Login: Enter correct email + password.
  - **Expected**: Immediate authentication with loading spinner and redirect to `/dashboard`.

## 7. Session Persistence on Page Refresh
- [ ] While logged in on `/dashboard`, `/telemetry`, or `/profile`, perform a hard browser refresh (`Ctrl + F5` or `F5`).
  - **Expected**: Session persists seamlessly without logging the user out.
  - **Expected**: Header avatar and user details immediately render from stored state without flashing `'U'` or `'Operator'`.

## 8. Compliance & Legal Link Verification
- [ ] On `/login` and `/register`, verify links to `/terms` and `/privacy`.
- [ ] On `/` (Landing Page) footer and Dashboard bottom footer strip, click **Terms of Service** and **Privacy & Security**.
  - **Expected**: Both lead to `/terms` and `/privacy` using the lightweight shared enterprise layout.
