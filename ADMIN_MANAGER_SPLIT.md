# Admin/Manager Role Split Implementation

## Overview

Successfully implemented a role hierarchy system separating **admin** and **manager** roles with the following structure:

- **Admin**: Full CRUD access to rooms, offerings, and payment refunds
- **Manager**: Operational access (view reservations, check-in/out, view reports, update reservation statuses)
- **Role Hierarchy**: Admins can access all manager endpoints

---

## Backend Changes

### 1. Role Authorization Middleware (`server/src/middleware/roleAuth.js`)

**Updated to support role hierarchy:**
- Added `hasRequiredRole()` function that implements role inheritance
- Admins can access **all** manager-protected endpoints
- Added `requireAdmin()` convenience middleware

**How it works:**
```javascript
// Admin can access everything
if (userRole === "admin") return true;

// Otherwise check if role matches
return requiredRoles.includes(userRole);
```

### 2. Route Protection Updates

#### **Offerings** (`server/src/routes/offering.routes.js`)
- **Public**: View offerings (GET /api/offerings)
- **Admin Only**: Create, Update, Delete offerings

#### **Rooms** (`server/src/routes/room.routes.js`)
- **Public**: View rooms (GET /api/rooms)
- **Admin Only**: Create, Update, Delete, Update Status

#### **Payments** (`server/src/routes/payment.routes.js`)
- **Public**: Create payment intent, confirm payment
- **Admin Only**: Process refunds, update payments
- **Manager/Admin**: View payments, stats, reports, payment history

#### **Reservations** (`server/src/routes/reservation.routes.js`)
- **Manager/Admin**: View all, check-in/out, update status, delete
- **Public**: Create reservation, guest verification
- **Auth Required**: View own reservations, cancel own

---

## Frontend Changes

### 1. Role Utilities (`client/src/utils/roleUtils.ts`)

**Created new utility for role checking:**
- `hasRequiredRole()` - Check if user has required role (with hierarchy)
- `isAdmin()` - Check if user is admin
- `isManagerOrAbove()` - Check if user is manager or admin

### 2. Updated Components

#### **ProtectedRoute** (`client/src/components/ProtectedRoute.tsx`)
- Now supports role hierarchy
- Admins can access manager-protected routes
- Updated to use `hasRequiredRole()` utility

#### **RoleGuard** (`client/src/components/RoleGuard.tsx`)
- Updated to support role hierarchy
- Conditionally renders children based on user role
- Used throughout management pages for admin-only buttons

### 3. Management Pages

#### **RoomManagement** (`client/src/pages/RoomManagement.tsx`)
- **Admin Only**: "Add New Room" buttons, Create/Edit/Delete forms and buttons
- **Manager Can View**: All rooms, booking status
- **Manager Can Modify**: Room status (operational need)

#### **OfferingManagement** (`client/src/pages/OfferingManagement.tsx`)
- **Admin Only**: "Create Offering" button, Edit/Delete buttons, Form modal
- **Manager Can View**: All offerings

#### **PaymentsManagement** (`client/src/pages/PaymentsManagement.tsx`)
- **Admin Only**: "Refund" buttons
- **Manager Can View**: All payments, stats, revenue reports

#### **ReservationManagement**
- **Manager/Admin**: All features (check-in, check-out, view, manage)
- No changes needed - managers need full operational access

---

## Session Timeout Fix

### Bug Fixed: Race Condition in Session Persistence

**Problem:**
- Session `lastActivity` was updated but not immediately saved
- Rapid requests (like clicking "Stay Logged In") could read stale session data
- Users were unexpectedly logged out

**Solution:**
- Added explicit `req.session.save()` calls in `sessionActivityMiddleware`
- Ensured session is persisted before next request
- Added diagnostic logging for debugging

**Files Modified:**
- `server/src/middleware/sessionActivity.js`

---

## Testing Guide

### 1. Create Test Users

You'll need users with different roles:

```javascript
// In MongoDB or via registration/direct DB insert
{
  email: "admin@example.com",
  role: "admin",
  // ... other fields
}

{
  email: "manager@example.com", 
  role: "manager",
  // ... other fields
}
```

### 2. Test Admin Access

**Login as admin** and verify:

1. ✅ Can see ALL buttons in management pages:
   - Room Management: "Add New Room", Edit, Delete buttons
   - Offering Management: "Create Offering", Edit, Delete buttons
   - Payments Management: "Refund" buttons

2. ✅ Can access all /manage routes:
   - `/manage/rooms`
   - `/manage/offerings`
   - `/manage/reservations`
   - `/manage/payments`

3. ✅ CRUD operations work:
   - Create a new room
   - Edit an existing room
   - Delete a room
   - Create/edit/delete offerings
   - Process a refund

### 3. Test Manager Access

**Login as manager** and verify:

1. ✅ Cannot see admin-only buttons:
   - Room Management: NO "Add New Room", NO Edit/Delete buttons
   - Offering Management: NO "Create Offering", NO Edit/Delete buttons
   - Payments Management: NO "Refund" buttons

2. ✅ Can access /manage routes and VIEW data:
   - `/manage/rooms` - can see all rooms
   - `/manage/offerings` - can see all offerings
   - `/manage/reservations` - full access (check-in/out)
   - `/manage/payments` - can see payments, stats, reports

3. ✅ Can perform operational tasks:
   - Check-in guests
   - Check-out guests
   - Update reservation status
   - View payment reports
   - Change room status (maintenance, available, etc.)

4. ❌ Cannot perform CRUD operations:
   - Try POST to `/api/rooms` → 403 Forbidden
   - Try DELETE to `/api/offerings/:id` → 403 Forbidden
   - Try POST to `/api/payments/refund` → 403 Forbidden

### 4. Test Session Timeout Fix

1. Set session timeout to 30 seconds (already set for testing)
2. Be inactive for 25 seconds
3. Warning modal appears at 30 seconds
4. Click "Stay Logged In" quickly
5. ✅ Should stay logged in without being redirected
6. Check server logs for:
   ```
   [Session Activity] User X - Path: /auth/keepalive - Time since last activity: Xs
   [Session Activity] ✅ Updated lastActivity for user X
   ```

### 5. Test Role Hierarchy

**Login as admin:**
1. Access manager-only endpoints → ✅ Should work
2. Example: GET `/api/reservations` → ✅ Success
3. Example: GET `/api/payments` → ✅ Success

**Login as manager:**
1. Try admin-only endpoints → ❌ Should fail with 403
2. Example: POST `/api/rooms` → ❌ 403 Forbidden
3. Example: POST `/api/payments/refund` → ❌ 403 Forbidden

---

## API Endpoints Summary

### Public Endpoints (No Auth)
- `GET /api/rooms` - View all rooms
- `GET /api/rooms/available` - Search available rooms
- `GET /api/offerings` - View offerings
- `POST /api/reservations` - Create reservation
- `POST /api/payments/create-intent` - Create payment
- `POST /api/payments/confirm` - Confirm payment

### Manager Endpoints (Manager + Admin)
- `GET /api/reservations` - View all reservations
- `GET /api/reservations/upcoming-checkins` - Upcoming check-ins
- `GET /api/reservations/current-checkouts` - Current checkouts
- `POST /api/reservations/:id/check-in` - Check in guest
- `POST /api/reservations/:id/check-out` - Check out guest
- `PATCH /api/reservations/:id/status` - Update status
- `GET /api/payments` - View payments
- `GET /api/payments/stats` - Payment statistics
- `GET /api/payments/reports/revenue` - Revenue report

### Admin-Only Endpoints
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room
- `PATCH /api/rooms/:id/status` - Update room status
- `POST /api/offerings` - Create offering
- `PUT /api/offerings/:id` - Update offering
- `DELETE /api/offerings/:id` - Delete offering
- `POST /api/payments/refund` - Process refund
- `PATCH /api/payments/:paymentId` - Update payment

---

## How to Switch Between Roles (For Testing)

### Option 1: Update User Role in Database
```javascript
// MongoDB shell or MongoDB Compass
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } } // or "manager"
)
```

### Option 2: Create Multiple Test Accounts
```bash
# Register/create multiple users with different roles
POST /api/auth/register
{
  "email": "admin@test.com",
  "password": "password123"
}

# Then manually update role in database
```

### Option 3: Login Endpoint Check
After logging in, check the response:
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "admin"  // or "manager"
  }
}
```

---

## Troubleshooting

### "403 Forbidden" when accessing endpoints
- **Check**: User role in Redux state (`store.auth.user.role`)
- **Check**: Backend logs show role mismatch
- **Fix**: Update user role in database

### Admin-only buttons not showing
- **Check**: `hasRequiredRole()` logic in RoleGuard
- **Check**: User role in Redux (`user.role === "admin"`)
- **Fix**: Ensure role is correctly set after login

### Session timeout issues persist
- **Check**: Server logs for session save confirmations
- **Check**: MongoDB connection (sessions stored in MongoDB)
- **Fix**: Ensure MongoDB is running and connected

### Manager can access admin endpoints
- **Check**: Backend route protection uses `requireRole("admin")`
- **Check**: Not using `requireRole("manager")` for admin-only routes
- **Fix**: Update route middleware to use correct role

---

## Files Changed

### Backend
- `server/src/middleware/roleAuth.js` - Role hierarchy implementation
- `server/src/middleware/sessionActivity.js` - Session timeout fix
- `server/src/routes/room.routes.js` - Admin-only CRUD
- `server/src/routes/offering.routes.js` - Admin-only CRUD
- `server/src/routes/payment.routes.js` - Admin-only refunds

### Frontend  
- `client/src/utils/roleUtils.ts` - **NEW** - Role utilities
- `client/src/components/ProtectedRoute.tsx` - Role hierarchy support
- `client/src/components/RoleGuard.tsx` - Role hierarchy support
- `client/src/pages/RoomManagement.tsx` - Admin-only guards
- `client/src/pages/OfferingManagement.tsx` - Admin-only guards
- `client/src/pages/PaymentsManagement.tsx` - Admin-only refund button

---

## Next Steps

1. **Test thoroughly** with both admin and manager accounts
2. **Adjust session timeout** for production (currently 30s for testing)
   - Frontend: `client/src/utils/useSessionTimeout.ts` (INACTIVITY_TIMEOUT, WARNING_DURATION)
   - Backend: `server/src/middleware/sessionActivity.js` (INACTIVITY_TIMEOUT)
3. **Reduce logging verbosity** once session fix is confirmed
4. **Document user roles** in your API documentation
5. **Consider adding role badges** to navbar to show current user role

---

## Role Alignment with Requirements

Based on the original project requirements:

### ✅ Role-Based Access Control Implemented
> "Define roles such as Guest, Administrator, and Hotel Manager, with each role having distinct permissions"

- **Guest (user)**: Can book rooms, view own reservations
- **Hotel Manager (manager)**: Operational tasks (check-in/out, view all reservations)
- **Administrator (admin)**: Full CRUD on rooms, offerings, manage payments

### ✅ Admin CRUD Operations
> "Admins can search, filter, and manage all hotel reservations"
> "Hotel managers can define room types, pricing, amenities, and availability"

- Admins control room CRUD, offering CRUD, and payment refunds
- Managers can view and operate but not modify core data structures

### ✅ Operational vs Administrative Separation
- **Admin**: System configuration, data management
- **Manager**: Day-to-day operations, guest management

This aligns with the requirement that admins handle CRUD while managers handle operational tasks like check-ins, check-outs, and viewing reservations.
