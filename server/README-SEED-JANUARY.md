# January 2026 Test Dataset - Usage Guide

## Overview

This seeder script creates a complete, realistic test dataset for the TIOCA Reservation System covering the entire month of January 2026. It provides comprehensive test data for all major features including bookings, payments, user management, and edge cases.

## ⚠️ Important Warnings

- **This script DROPS ALL DATA** in the `tioca-reservation-system` database
- **Use ONLY in development/testing environments**
- **Never run on production data**
- The script is idempotent - you can run it multiple times safely

## How to Run

### Option 1: MongoDB Playground (VS Code)

1. Open `playground-seed-january.mongodb.js` in VS Code
2. Ensure MongoDB Playground extension is installed
3. Click the "Play" button or press `Ctrl+Alt+P` (Windows/Linux) or `Cmd+Option+P` (Mac)
4. Review the output in the MongoDB Playground Results panel

### Option 2: mongosh (MongoDB Shell)

```bash
# Navigate to server directory
cd server

# Run the seeder
mongosh --file playground-seed-january.mongodb.js

# Or connect first, then load
mongosh
use tioca-reservation-system
load('playground-seed-january.mongodb.js')
```

### Option 3: MongoDB Compass

1. Open MongoDB Compass
2. Connect to your local MongoDB instance
3. Navigate to the `tioca-reservation-system` database
4. Open the "Aggregations" tab on any collection
5. Switch to "Pipeline" mode and paste the script content
6. Note: Some features may not work in Compass; use mongosh or Playground instead

## What Gets Created

### Collections & Counts

| Collection       | Count  | Description                                                              |
| ---------------- | ------ | ------------------------------------------------------------------------ |
| **offerings**    | 12     | 8 room types (single + twin variants) + 4 amenities                      |
| **rooms**        | 100    | 25 pods per floor across 4 floors                                        |
| **users**        | 9      | 2 staff (admin + manager), 4 authenticated users, 2 OAuth users, 1 guest |
| **reservations** | ~35-40 | January bookings across all statuses                                     |
| **payments**     | ~35-40 | Payment records linked to reservations                                   |

### User Accounts

All accounts created by the seeder:

| Email                  | Password    | Type         | Role    | Responsibilities                                                                      |
| ---------------------- | ----------- | ------------ | ------- | ------------------------------------------------------------------------------------- |
| admin@tioca.com        | password123 | Local        | admin   | **Full CRUD**: Create/Edit/Delete rooms, offerings, process refunds                   |
| manager@tioca.com      | password123 | Local        | manager | **Operations**: View/manage reservations, check-in/out, view reports, update statuses |
| keemkeem321@gmail.com  | -           | Google OAuth | user    | Customer account                                                                      |
| sarah.chen@gmail.com   | -           | Google OAuth | user    | Customer account                                                                      |
| michael.r@gmail.com    | -           | Google OAuth | user    | Customer account                                                                      |
| emily.wong@example.com | password123 | Local        | user    | Customer account                                                                      |
| david.kim@example.com  | password123 | Local        | user    | Customer account                                                                      |
| jessica.park@guest.com | -           | Guest        | user    | Guest booking only (no account)                                                       |
| robert.m@guest.com     | -           | Guest        | user    | Guest booking only (no account)                                                       |

**Admin vs Manager Split:**

- **Admin** (admin@tioca.com): Can create/edit/delete rooms and offerings, process refunds. Has access to all manager features.
- **Manager** (manager@tioca.com): Can view and manage reservations, perform check-in/check-out, view analytics/reports. No ability to modify inventory.

### Room Distribution (100 pods total)

**Floor 1 - Women-Only (25 pods)**

- 10 Classic Pearl (101-110)
- 8 Milk Pearl (111-118)
- 5 Golden Pearl (119-123)
- 2 Matcha Pearl (124-125)

**Floor 2 - Men-Only (25 pods)**

- 12 Classic Pearl (201-212)
- 8 Milk Pearl (213-220)
- 5 Golden Pearl (221-225)

**Floor 3 - Couples (25 pods, all twin variants)**

- 8 Twin Classic Pearl (301-308)
- 10 Twin Milk Pearl (309-318)
- 7 Twin Golden Pearl (319-325)

**Floor 4 - Business (25 pods)**

- 10 Classic Pearl (401-410)
- 8 Milk Pearl (411-418)
- 5 Golden Pearl (419-423)
- 2 Crystal Boba Suite (424-425)

### Reservation Coverage

**Date Range:** January 1-31, 2026

**Occupancy:** ~60-70% of total inventory, leaving 30-40% available for testing

**Status Distribution:**

- `confirmed` - Future bookings with payment complete
- `checked-in` - Currently staying guests (Jan 13-16)
- `checked-out` - Completed stays
- `pending` - Awaiting payment
- `cancelled` - Cancelled reservations
- `no-show` - Guest didn't arrive

### Payment Scenarios Included

1. **Standard successful payments** - Most common case
2. **Failed payment** - Card declined scenario
3. **Pending payment** - Booking created, payment in progress
4. **Partial refund** - Guest modified reservation, partial refund issued
5. **Full refund** - Cancellation with full refund
6. **Overpayment** - Guest paid too much, needs correction
7. **No-show with payment** - Guest paid but didn't arrive
8. **Processing payment** - Payment still being processed

## Testing Scenarios

### Booking System Tests

**Available Inventory:**

- ~30-40% of pods remain unbooked throughout January
- Each floor has available pods for testing new bookings
- Test overlapping date ranges to validate conflict detection

**Conflict Testing:**

- Some pods are fully booked on specific dates
- Try booking already-occupied pods to test validation
- Check-in/check-out time conflicts included

**Sample Available Pods (always free for testing):**
Check the seeder output for specific pod IDs that remain available

### Payment Management Tests

**Dashboard Analytics:**

- Revenue calculations from succeeded payments
- Refund tracking and reporting
- Payment status distribution
- Failed payment monitoring

**Edge Cases:**

- Overpayment requiring manual intervention
- Partial refunds from modified bookings
- Failed payments with cancellations
- Multiple payment attempts for same reservation

### Admin vs Manager Role Tests

**Test Admin Account (admin@tioca.com):**

- ✅ Should see "Add New Room" button in Room Management
- ✅ Should see "Create Offering" button in Offering Management
- ✅ Should see "Refund" buttons in Payments Management
- ✅ Can create, edit, delete rooms
- ✅ Can create, edit, delete offerings
- ✅ Can process refunds

**Test Manager Account (manager@tioca.com):**

- ✅ Should NOT see "Add New Room" button
- ✅ Should NOT see "Create Offering" button
- ✅ Should NOT see "Refund" buttons (cannot issue refunds directly)
- ✅ Can view all rooms (but cannot create/delete)
- ✅ Can view all offerings (but cannot create/delete)
- ✅ Can view all payments and payment history
- ✅ Can view and manage all reservations
- ✅ Can perform check-in/check-out operations
- ✅ Can view reports and analytics

**Authentication Types:**

- Local strategy (email/password)
- Google OAuth (with provider IDs)
- Guest bookings (no account required)

**Role-Based Access:**

- Manager account for admin features
- Regular users for customer features
- Guest-only reservations

### Date-Based Testing

**Past Events (Jan 1-14):**

- Completed check-outs
- No-shows
- Historical revenue data

**Current Period (Jan 15 - today):**

- Active check-ins
- Pending payments
- Immediate bookings

**Future Events (Jan 16-31):**

- Confirmed future reservations
- Upcoming check-ins
- Cancellation testing

## Data Relationships

All data is properly linked with MongoDB ObjectIds:

```
users._id → reservations.userId
rooms._id → reservations.roomId
offerings._id → rooms.offeringId
reservations._id → payments.reservationId
users._id → payments.userId
```

## Customization

To modify the dataset:

1. **Add more bookings:** Add calls to `createReservationAndPayment()` in the script
2. **Change occupancy:** Adjust the number of bookings in the "additional bookings" section
3. **Modify users:** Edit the `users` array
4. **Change room distribution:** Modify the `createRoomsForFloor()` calls
5. **Adjust pricing:** Update the `ROOM_OFFERINGS` base prices

## Validation Checks

The script includes built-in validation:

- ✅ Room availability checking (prevents double-booking)
- ✅ Cross-collection ID linking
- ✅ Date range validation
- ✅ Price calculations based on stay length
- ✅ Status consistency (payment status matches reservation status)

## Troubleshooting

**Issue:** Script fails with "No rooms found"

- **Solution:** Ensure offerings are created first (script handles this automatically)

**Issue:** Duplicate key errors

- **Solution:** The script drops collections first; ensure no external locks on collections

**Issue:** Missing reservations

- **Solution:** Check the console output for warnings about unavailable rooms

**Issue:** Payment amounts don't match

- **Solution:** Some scenarios intentionally include overpayments/underpayments for testing

## Expected Output

After successful execution, you should see:

```
========================================
SEEDING COMPLETE - SUMMARY REPORT
========================================

--- COLLECTIONS ---
Offerings: 12
Rooms: 100
Users: 8
Reservations: 35-40
Payments: 35-40

--- USER ACCOUNTS ---
[List of test accounts]

--- RESERVATION STATUS BREAKDOWN ---
[Status counts]

--- PAYMENT STATUS BREAKDOWN ---
[Payment status counts]

--- REVENUE SUMMARY ---
Total revenue (succeeded): $X,XXX.XX
Total refunded: $XXX.XX

--- ROOM OCCUPANCY ---
[Bookings per floor]

--- SAMPLE AVAILABLE PODS ---
[Pod IDs available for testing]

✓ Dataset ready for testing!
```

## Best Practices

1. **Run in development only** - Never on production
2. **Run before major testing sessions** - Ensures clean state
3. **Review the output** - Check for warnings or errors
4. **Save custom scenarios** - Create separate scripts for specific test cases
5. **Document modifications** - If you customize the script, note the changes

## Integration with Application

This dataset is designed to work with:

- ✅ Frontend booking flow
- ✅ Payment processing UI
- ✅ Manager dashboard
- ✅ Reservation management
- ✅ User profile pages
- ✅ Analytics and reporting
- ✅ Authentication flows

## Next Steps

After running the seeder:

1. Start your application backend
2. Test the booking flow with available pods
3. Log in with test accounts to view reservations
4. Test payment scenarios using the manager dashboard
5. Verify data relationships in MongoDB Compass
6. Run your application's test suite

## Notes

- **Current date assumed:** January 15, 2026 (as specified in context)
- **Timezone:** All dates use local timezone (adjust as needed)
- **Currency:** Prices in USD cents (e.g., 6500 = $65.00)
- **Stripe IDs:** Mock IDs for testing (prefix: `pi_jan_`, `cus_jan_`, `ch_jan_`)

## Support

For issues or questions:

- Check MongoDB connection is active
- Ensure database name is correct: `tioca-reservation-system`
- Review console output for specific errors
- Verify MongoDB version compatibility (requires 4.4+)
