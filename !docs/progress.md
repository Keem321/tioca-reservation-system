# Progress & Gaps (Updated Jan 8 2026)

## Current Architecture Snapshot

- Backend: Node.js/Express, MongoDB/Mongoose, Passport (local & Google).
- Frontend: React + TypeScript + RTK Query (Vite).
- Deployment: Procfile present; no Spring stack components.
- Booking: Public booking flow implemented; no auth required for reservations/payments.

## TODO

- Change pricing to be by base costs (by quality) + per-amenity costs. Currently, pricing is a flat number per room. Business floor and couples floor have higher base costs (implemented as an amenity cost).
- Guest account creation: Allow users to optionally create an account during/after booking for tracking reservations
- Email confirmations: Send booking confirmations and updates to guest email
- Payment integration: Complete Stripe payment flow with webhooks and proper status handling

## Requirement Coverage

- Authentication & Authorization
  - Status: **Implemented (Passport local & Google OAuth2 + RBAC)**. Auth via Passport (local & Google); roles (guest, manager) enforced on API and UI; user role returned in session and stored in Redux.
- Role-Based Access Control
  - Status: **Implemented**. Role model on User; middleware (`requireRole`, `requireAuth`) protects routes; RoleGuard component for UI; ProtectedRoute wrapped with `requiredRole="manager"` for manager pages.
- User Profiles

  - Status: **Implemented**. Profile endpoints (`/api/user/profile`, change password, active reservations) and a Profile page with edit form and a list of upcoming reservations.

- Room Management

  - Add/Edit/Delete Rooms: **Implemented (basic)**. CRUD endpoints and initial manager UI exist; single-hotel; `podId` unique. Amenities/pricing editable. A new management view adds search/filtering and by-floor overview.
  - Availability: **Implemented**. Date-range availability endpoint with proper overlap checking; returns only status='available' rooms without booking conflicts; recommended rooms endpoint suggests partial availability alternatives.
  - Capacity limits: **Implemented for reservations**. Service enforces room capacity on create/update.

- Reservation Management

  - Room Booking: **Implemented**. Public booking flow (no auth required); overlap prevention in repository layer; recommended rooms feature for flexibility.
  - Reservation Details: **Partial**. List/detail endpoints/UI. Cancel allowed. No confirmation emails.
  - Modify Reservations: **Partial**. Update endpoints/UI exist; availability checked. No change room-type logic beyond roomId.
  - Reservation Search/Dashboard: **Partial**. Manager pages list/filter by status; no advanced filters (date range, guest, podId search).

- Payment Processing
  - Payment flow: **Routes exist**. Payment routes made public for guest checkout; no Stripe integration yet.
  - Simulated payments/transaction IDs: **Not implemented**. No payment model/status transitions besides a string field in reservations.
  - Stripe integration: **Not implemented**. No payment intent/checkout/webhooks.
  - Transaction history/reports: **Not implemented**.
- Capacity Reports

  - Status: **Not implemented**. No reporting endpoints or UI.

- UI/UX

  - Responsive design: **Basic**. Vite/React with CSS; booking cards use responsive grid (4 per row on desktop).
  - Intuitive navigation: **Partial**. Landing + dashboard pages; no breadcrumbs/tabs; navigation minimal.
  - Search & filter: **Implemented for booking**. Floor/zone selection with recommended alternatives; status filter for reservations; no advanced room search for managers.
  - Error handling: **Partial**. Basic alerts; no friendly error UX for payments/edge cases.

- Edge Case Handling
  - Overbooking prevention: **Implemented**. Repository layer checks overlapping reservations before returning available rooms; race condition possible under extreme concurrency but mitigated by proper filtering.
  - Payment failures: **Not applicable/Not implemented**. No payment flows integrated.
  - Session expiration: **Not implemented**. No UX for timeout warnings.

## Suggested Next Steps

1. **Integrate Stripe payments**: Create payment intents, store transaction IDs/status, add webhooks and refund flow
2. **Email notifications**: Send booking confirmations and reservation updates to guest email
3. **Guest account creation**: Allow optional account creation during checkout to track reservations
4. **Manager tools enhancement**: 
   - Add advanced reservation search (date range, guest email, podId)
   - Capacity and transaction reporting endpoints with UI
   - Bulk operations for check-in/check-out
5. **Pricing model update**: Implement base cost (by quality) + per-amenity pricing structure
6. **UI polish**: Improve responsive layout, add loading states, enhance error handling
7. **Performance**: Add pessimistic locking for high-concurrency booking scenarios
