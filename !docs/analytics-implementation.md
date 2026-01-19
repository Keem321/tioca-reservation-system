# Analytics Implementation

## Overview

This document describes the user analytics system implemented for tracking bounce rates in the booking process.

## Features

### Anonymous Tracking
- All tracking is anonymous and session-based
- Uses browser sessionStorage to generate unique session IDs
- No personal information is collected
- Session IDs are unique per browser tab/session

### Booking Funnel Stages

The analytics system tracks three main stages of the booking process:

1. **Search** - User browsing available rooms on `/booking`
2. **Confirm** - User entering booking details on `/booking/confirm`
3. **Payment** - User completing payment on `/payment`
4. **Success** - User successfully completed booking on `/payment/success`

### Events Tracked

For each stage, the following events are tracked:

- **enter** - User enters a stage (page load)
- **exit** - User leaves a stage (page unload/navigation away)
- **complete** - User successfully completes a stage (moves to next step)

## Architecture

### Backend

#### Database Model
- **File**: `server/src/models/analytics.model.js`
- **Collection**: `AnalyticsEvent`
- **Fields**:
  - `sessionId` - Anonymous session identifier
  - `stage` - Booking stage (search, confirm, payment, success)
  - `event` - Event type (enter, exit, complete)
  - `metadata` - Optional additional data
  - `ipAddress` - IP address (for basic tracking)
  - `userAgent` - Browser info
  - `createdAt` - Timestamp (auto-generated)

#### API Endpoints

**Public Endpoint** (no authentication required):
- `POST /api/analytics/track` - Track an analytics event

**Protected Endpoints** (manager role required):
- `GET /api/analytics/summary` - Get bounce rates and funnel metrics
  - Query params: `startDate`, `endDate` (optional)
- `GET /api/analytics/events` - Get recent events (debugging)
  - Query params: `limit` (optional)
- `GET /api/analytics/trends` - Get daily trends
  - Query params: `startDate`, `endDate` (optional)

#### Controllers
- **File**: `server/src/controllers/analytics.controller.js`
- Functions:
  - `trackEvent` - Records analytics events
  - `getAnalyticsSummary` - Calculates bounce rates and metrics
  - `getRecentEvents` - Returns recent events for debugging
  - `getDailyTrends` - Returns daily breakdown of analytics

### Frontend

#### Analytics Hook
- **File**: `client/src/hooks/useAnalytics.ts`
- **Hook**: `useAnalyticsTracking(stage, enabled?)`
- **Usage**:
  ```typescript
  const { trackComplete } = useAnalyticsTracking("search");
  // Call trackComplete() when user proceeds to next stage
  ```

#### Integration Points

1. **Booking Page** (`client/src/pages/Booking.tsx`)
   - Tracks "search" stage
   - Calls `trackComplete()` when user selects a room

2. **Booking Confirmation** (`client/src/pages/BookingConfirmation.tsx`)
   - Tracks "confirm" stage
   - Calls `trackComplete()` when user proceeds to payment

3. **Payment Page** (`client/src/pages/Payment.tsx`)
   - Tracks "payment" stage
   - Calls `trackComplete()` when payment succeeds

4. **Payment Success** (`client/src/pages/PaymentSuccess.tsx`)
   - Tracks "success" stage
   - No completion tracking (final stage)

#### Analytics Dashboard
- **File**: `client/src/pages/Analytics.tsx`
- **Route**: `/manage/analytics` (protected - manager only)
- **Features**:
  - Overall conversion metrics
  - Stage-by-stage bounce rates
  - Completion rates per stage
  - Date range filtering
  - Visual cards with color-coded metrics

#### API Integration
- **File**: `client/src/features/analyticsApi.ts`
- RTK Query API for fetching analytics data
- Integrated into Redux store

## Metrics Explained

### Bounce Rate
Percentage of users who left at a stage without completing it.

**Formula**: `(bounced / entered) * 100`

### Completion Rate
Percentage of users who successfully completed a stage.

**Formula**: `(completed / entered) * 100`

### Conversion Rate
Percentage of all sessions that completed payment.

**Formula**: `(completedPayment / totalSessions) * 100`

## Usage

### Accessing the Dashboard

1. Log in as a manager
2. Navigate to **Management → Analytics** in the navbar
3. View real-time metrics and bounce rates
4. Use date filters to analyze specific time periods

### Understanding the Data

- **Total Sessions**: Unique browser sessions that started the booking process
- **Completed Bookings**: Sessions that successfully completed payment
- **Entered**: Number of sessions that reached a specific stage
- **Bounced**: Number of sessions that left without completing the stage
- **Completed**: Number of sessions that moved to the next stage

### Example Scenario

If 100 users visit the search page:
- 80 select a room and proceed to confirmation (20% bounce on search)
- 60 fill out details and proceed to payment (25% bounce on confirm)
- 50 complete payment (16.7% bounce on payment)
- Overall conversion rate: 50%

## Privacy & Compliance

- **No PII**: No personally identifiable information is collected
- **Anonymous**: Session IDs are random and not linked to user accounts
- **Temporary**: Session IDs are stored in sessionStorage (cleared when tab closes)
- **IP Address**: Only stored for basic analytics, not used for identification
- **GDPR Compliant**: Anonymous analytics do not require consent

## Future Enhancements

Potential improvements for the analytics system:

1. **Daily Trends Chart**: Visualize bounce rates over time
2. **Funnel Visualization**: Interactive funnel diagram
3. **A/B Testing**: Track different booking flows
4. **Exit Points**: Detailed tracking of where users leave
5. **Time on Stage**: Average time spent at each stage
6. **Device Analytics**: Breakdown by mobile/desktop
7. **Geographic Data**: Anonymous location-based insights
8. **Conversion Goals**: Track specific conversion targets

## Testing

To test the analytics system:

1. Open the booking page in an incognito/private window
2. Go through the booking process (search → confirm → payment)
3. Log in as a manager
4. Navigate to `/manage/analytics`
5. View the tracked sessions and bounce rates

## Troubleshooting

### No Data Showing
- Ensure the analytics tracking hook is properly integrated
- Check browser console for errors
- Verify the API endpoint is accessible
- Check MongoDB connection

### Incorrect Metrics
- Clear browser cache and sessionStorage
- Verify event tracking is firing (check Network tab)
- Review the analytics calculation logic in the controller

### Access Denied
- Ensure user has manager role
- Check authentication middleware
- Verify protected route configuration
