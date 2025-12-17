# Hotel Reservation System

## Objective

Develop a hotel reservation platform that streamlines the booking process for guests while providing hotel administrators and employees with tools for managing room availability, reservations, and amenities. The system features a secure and responsive user interface for both guests and employees, with secure authentication and effective role-based access. The frontend, backend, and database are all deployed to AWS.

---

## Functional Requirements

### User Management

- **Authentication & Authorization:** Implement OAuth2-based authentication using Passport.js in Express. Users can sign in via third-party providers (e.g., Google, Facebook).
- **Role-Based Access Control:** Define roles such as Guest, Administrator, and Hotel Manager, each with distinct permissions (e.g., guests can book rooms, while administrators can manage room inventory and reservations).
- **User Profiles:** Enable users to view and update their personal information, including saved bookings, payment details, and preferences.

### Room Management

- **Add/Edit/Delete Rooms:**
  - Hotel managers can define room types, pricing, amenities, and availability. Changes should reflect dynamically on the frontend.
- **Room Availability:**
  - Ensure that guests can view real-time room availability during their reservation process.
- **Capacity Limits:**
  - Rooms should have maximum guest capacities, and the system should enforce these constraints when processing bookings.

### Reservation Management

- **Room Booking:**
  - Allow users to select dates, room type, and number of guests. Prevent overbooking by validating availability.
- **Reservation Details:**
  - Guests can view upcoming and past reservations, cancel bookings within policy limits, and receive confirmation emails.
- **Modify Reservations:**
  - Implement functionality for guests to modify reservation details (e.g., change dates or room type) based on availability.
- **Reservation Search:**
  - Provide a dashboard for admins to search, filter, and manage all hotel reservations.

### Payment Processing

- **Simulated Payments:**
  - Simulate guest payments with transaction IDs, secure payment method storage, and payment status updates.
- **Stripe API Integration:**
  - Securely process payments, support multiple payment methods (credit cards, digital wallets), and implement payment notifications, refunds, and receipts using Stripe.
- **Transaction Management:**
  - Allow admins to view transaction history, payment statuses, and generate financial reports.
- **Capacity Reports:**
  - Generate reports on room utilization, showing trends in capacity usage over time.

### User Interface (UI) & User Experience (UX)

- **Responsive Design:**
  - Ensure the system is fully functional across desktop, tablet, and mobile devices.
- **Intuitive Navigation:**
  - UI is easy to navigate, with clearly labeled sections and buttons. Utilize breadcrumbs, collapsible menus, and tabs where appropriate.
- **Search and Filter:**
  - Provide advanced search and filter options across room listings to help users quickly find the room they're searching for.
- **Error Handling:**
  - Display user-friendly error messages for common edge cases (e.g., room overbooking, invalid payment details).

### Edge Case Handling

- **Overbooking Prevention:**
  - Handle multiple guests attempting to book the same room at the same time.
- **Payment Failures:**
  - Provide retry options and fallback mechanisms for failed payment attempts.
- **Session Expiration:**
  - Notify users of session timeouts during reservation to prevent data loss.

---

## Technical Requirements

- **Full-stack solution consisting of:**
  - **JavaScript** (Node.js/Express backend)
  - **Express** (using Passport for OAuth authentication)
  - **React** (with Redux and RTK Query)
  - **TypeScript** for React
  - **MongoDB** (with DocumentDB on AWS)
  - **Stripe API** for payment processing
  - **AWS deployment** for frontend, backend, and database
- **All required CRUD functionality implemented**
- **Handles edge cases effectively**

---

## Non-Functional Requirements

- **Well-documented code** (JavaDocs/JSDoc style)
- **Code upholds industry best practices** (SOLID, DRY)
- **Industry-grade UI**
- **Intuitive UX**
- **DocumentDB** for MongoDB on AWS

---

## Notes for Project 2
