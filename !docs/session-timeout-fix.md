# Session Timeout Fix - January 2026

## Problem
Managers and admins were being logged out without the session timeout warning modal appearing first.

## Root Causes

### 1. Immediate Logout on 401 Response
**File:** `client/src/utils/baseQueryWithReauth.ts`

When any API call received a 401 response, the app would immediately dispatch `logout()` - completely bypassing the session timeout warning modal. This happened when:
- User makes an API call after backend session expires
- Backend returns 401 with SESSION_TIMEOUT code
- baseQueryWithReauth immediately logs them out without showing warning

**Fix:** Modified `baseQueryWithReauth` to detect `SESSION_TIMEOUT` 401 responses and let the frontend session timeout logic handle them gracefully instead of immediately logging out.

### 2. Backend Session Expiration Without Frontend Knowledge
**File:** `client/src/utils/useSessionTimeout.ts`

The frontend activity handler was resetting local timers on user activity (mouse movement, clicks, etc.) but **never told the backend** about this activity. 

**Timeline:**
- Frontend: 30s inactivity → show warning, 40s total → logout
- Backend: 60s inactivity → expire session

**What was happening:**
1. User is active (moves mouse, clicks around)
2. Frontend resets its own 30s timer on each activity
3. Backend `lastActivity` is NEVER updated (no keepalive calls)
4. After 60s, backend session expires
5. User makes API call → gets 401 SESSION_TIMEOUT
6. User logged out without warning!

**Fix:** Added periodic keepalive pings to backend (every 20 seconds of activity) to keep the backend session alive while user is active on frontend.

## Changes Made

### 1. baseQueryWithReauth.ts
- Added check for `SESSION_TIMEOUT` error code in 401 responses
- If SESSION_TIMEOUT detected, don't immediately logout - let frontend session timeout handle it
- Other 401s (invalid credentials, etc.) still trigger immediate logout

### 2. useSessionTimeout.ts
- Added `lastKeepAliveRef` to track when we last pinged the backend
- Modified activity handler to call `keepAlive()` every 20 seconds of activity (throttled)
- This ensures backend session stays alive while user is actively using the app
- Updated `resetActivity` to update the keepalive timestamp

## Result
- Users will now see the session timeout warning modal before being logged out
- Backend session stays alive as long as user is active on frontend
- Session timeout values remain unchanged (30s inactivity, 10s warning, 60s backend timeout)
- Works correctly for all user roles (user, manager, admin)

## Testing
To test:
1. Login as manager/admin
2. Be inactive for 30 seconds → warning modal should appear
3. Either click "Stay Logged In" or wait 10 more seconds → logout with modal visible
4. Or, be actively using the app → no logout should occur, backend session kept alive

## Technical Details

**Frontend Timeouts:**
- `INACTIVITY_TIMEOUT`: 30 seconds (time until warning appears)
- `WARNING_DURATION`: 10 seconds (countdown before logout)
- Total: 40 seconds

**Backend Timeout:**
- `INACTIVITY_TIMEOUT`: 60 seconds (server-side session expiration)
- 20 second buffer after frontend logout

**Keepalive Strategy:**
- Throttled to once every 20 seconds during user activity
- Prevents excessive API calls while ensuring backend knows user is active
- Automatically called on "Stay Logged In" button click
