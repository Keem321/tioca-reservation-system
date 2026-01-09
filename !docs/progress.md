# Progress & Gaps (Updated Jan 8 2026)

## Current Architecture Snapshot

- Backend: Node.js/Express, MongoDB/Mongoose, Passport (local & Google).
- Frontend: React + TypeScript + RTK Query (Vite).
- Deployment: Procfile present; no Spring stack components.
- Booking: Public booking flow implemented with time-based slot selection (30‑minute intervals), AM/PM time display, and same‑day 2‑hour prep buffer. Guest checkout supported (no auth required for reservations/payments).

## TODO

- Change pricing to be by base costs (by quality) + per-amenity costs. Currently, pricing is a flat number per room. Business floor and couples floor have higher base costs (implemented as an amenity cost).
- Guest account creation: Allow users to optionally create an account during/after booking for tracking reservations
- Email confirmations: Send booking confirmations and updates to guest email
- Payment integration: Complete Stripe payment flow with webhooks and proper status handling (client integration present; server webhooks/status lifecycle pending)

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

  - Room Booking: **Implemented**. Public booking flow (no auth required); overlap prevention in repository layer; recommended rooms feature for flexibility; time-slot selection with AM/PM display and same‑day 2‑hour buffer.
  - Reservation Details: **Implemented**. List/detail endpoints/UI with advanced search & filtering; can cancel reservations. Email notifications not yet implemented.
  - Modify Reservations: **Partial**. Update endpoints/UI exist; availability checked. No change room-type logic beyond roomId.
  - Reservation Search/Dashboard: **Implemented**. Manager pages support filtering by: status, date range (check-in from/to), guest email (partial match), pod ID. Sortable by date, status, or guest name. Bulk check-in/check-out for multiple reservations.

- Payment Processing

  - Payment flow: **Implemented**. Frontend integrates Stripe Elements and calls backend create/confirm intent endpoints; routes are public for guest checkout. Backend creates Payment records with status lifecycle (pending → succeeded/failed → refunded). Error handling tracks failed payments with reason/code.
  - Transaction model: **Implemented**. Dedicated Payment model with full schema: reservationId, userId (optional), amount, currency, status enum, Stripe refs (paymentIntentId, chargeId, customerId), refund tracking (refundAmount, refundStripeId), error tracking (failureReason, failureCode), receiptUrl, timestamps, and 5 indexes for efficient querying.
  - Transaction history/reports: **Implemented**. Backend endpoints for querying payments (filter by date, status, reservation), stats aggregation (by status count/amount, total revenue), and revenue report by month. Frontend Reports page displays stats cards, transaction table (sortable, filterable), monthly revenue breakdown, and refund capability.
  - Stripe integration: **Mostly complete**. Client-side Elements and intent creation/confirmation present; payment records created/updated on intent and confirm. processRefund updated to track refund amount/ID in Payment model. Webhooks still pending for edge cases.
  - Manager reports: **Implemented**. Reports page at `/manage/reports` with advanced filtering (date range, status), stats dashboard (total revenue, transaction count, breakdown by status), monthly revenue table, and transaction history with refund buttons. RTK Query hooks for payment data fetching.
  - Payment status lifecycle: **Implemented**. Payment records track: pending (on intent), processing (optional), succeeded (on confirm), failed (on error), refunded/partial (on refund). Failed payments logged with Stripe error reason/code.

- UI/UX

  - Responsive design: **Basic**. Vite/React with CSS; booking cards use responsive grid (4 per row on desktop).
  - Intuitive navigation: **Partial**. Landing + dashboard pages; no breadcrumbs/tabs; navigation minimal.
  - Search & filter: **Implemented for booking**. Floor/zone selection with recommended alternatives; status filter for reservations; no advanced room search for managers.
  - Booking clarity: **Improved**. Arrival/Departure labels include dates; no default time selections; details/pricing shown only after both times selected.
  - Payment summary: **Improved**. Room shown as `Pod {podId} - {quality}` (backend now populates room on reservation creation).
  - Error handling: **Partial**. Basic alerts; improved validation for times; no friendly error UX for payments/edge cases.

- Edge Case Handling
  - Overbooking prevention: **Implemented**. Repository layer checks overlapping reservations.
  - Same‑day buffer: **Implemented**. Check‑in must be ≥ 2 hours from now; server and slot endpoint enforce it.
  - Timezones: **Fixed**. Local date parsing avoids off‑by‑one; slot filtering for “today” compares minutes‑since‑midnight to avoid UTC drift.
  - Payment failures: **Not implemented**. Limited payment flow; no webhooks/rollback.
  - Session expiration: **Not implemented**. No UX for timeout warnings.

## Suggested Next Steps

1. **Stripe webhooks**: Add webhook handlers for payment_intent.succeeded/failed events for async confirmation
2. **Email notifications**: Send booking confirmations and reservation updates to guest email
3. **Guest account creation**: Allow optional account creation during checkout to track reservations
4. **Pricing model update**: Implement base cost (by quality) + per-amenity pricing structure
5. **UI polish**: Improve responsive layout, add loading states, enhance error handling for payment failures
6. **Performance**: Add pessimistic locking for high-concurrency booking scenarios
7. **Payment analytics**: Add date range filtering and export functionality to reports
