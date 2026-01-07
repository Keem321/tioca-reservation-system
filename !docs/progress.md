# Progress & Gaps (manager-tools, Jan 7 2026)

## Current Architecture Snapshot

- Backend: Node.js/Express, MongoDB/Mongoose, Passport (local & Google).
- Frontend: React + TypeScript + RTK Query (Vite).
- Deployment: Procfile present; no Spring stack components.

## Requirement Coverage

- Authentication & Authorization
  - Status: **Implemented (Passport local & Google OAuth2 + RBAC)**. Auth via Passport (local & Google); roles (guest, manager) enforced on API and UI; user role returned in session and stored in Redux.
- Role-Based Access Control
  - Status: **Implemented**. Role model on User; middleware (`requireRole`, `requireAuth`) protects routes; RoleGuard component for UI; ProtectedRoute wrapped with `requiredRole="manager"` for manager pages.
- User Profiles
  - Status: **Implemented**. Profile endpoints (`/api/user/profile`, change password, active reservations) and a Profile page with edit form and a list of upcoming reservations.

- Room Management

  - Add/Edit/Delete Rooms: **Implemented (basic)**. CRUD endpoints and initial manager UI exist; single-hotel; `podId` unique. Amenities/pricing editable. A new management view adds search/filtering and by-floor overview.
  - Availability: **Partial**. Date-range availability endpoint exists; overlap prevention enforced in reservation service; management view surfaces booked rooms in the next two weeks and by-floor availability over a selected date range.
  - Capacity limits: **Implemented for reservations**. Service enforces room capacity on create/update.

- Reservation Management

  - Room Booking: **Partial**. Create endpoints/UI; overlap check in service; single-hotel. No concurrent lock; relies on DB check.
  - Reservation Details: **Partial**. List/detail endpoints/UI. Cancel allowed. No confirmation emails.
  - Modify Reservations: **Partial**. Update endpoints/UI exist; availability checked. No change room-type logic beyond roomId.
  - Reservation Search/Dashboard: **Partial**. Manager pages list/filter by status; no advanced filters (date range, guest, podId search).

- Payment Processing
  - Simulated payments/transaction IDs: **Not implemented**. No payment model/status transitions besides a string field in reservations.
  - Stripe integration: **Not implemented**. No payment intent/checkout/webhooks.
  - Transaction history/reports: **Not implemented**.
- Capacity Reports

  - Status: **Not implemented**. No reporting endpoints or UI.

- UI/UX

  - Responsive design: **Basic**. Vite/React with CSS; not audited for full responsiveness.
  - Intuitive navigation: **Partial**. Landing + dashboard pages; no breadcrumbs/tabs; navigation minimal.
  - Search & filter: **Limited**. Status filter for reservations; no advanced room search.
  - Error handling: **Partial**. Basic alerts; no friendly error UX for payments/edge cases.

- Edge Case Handling
  - Overbooking prevention: **Partial**. Server checks overlaps per request; no pessimistic locking; race condition possible under high concurrency.
  - Payment failures: **Not applicable/Not implemented**. No payment flows.
  - Session expiration: **Not implemented**. No UX for timeout warnings.

## Suggested Next Steps

- Add overlap-aware availability endpoint (query reservations for date range) and use it in booking flow.
- Integrate payments (Stripe recommended): create payment intents, store transaction IDs/status, add webhooks and refund flow.
- Build reservation search filters (status, date range, guest email, podId) and capacity/transaction reporting endpoints with basic UI.
- Add profile endpoints/UI and improve responsive layout/error handling.
