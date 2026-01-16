/**
 * Session Activity Tracking Middleware
 *
 * Tracks the last activity time for authenticated users and enforces
 * server-side inactivity timeout.
 *
 * This provides defense-in-depth alongside the frontend timeout.
 * Even if a user manipulates the frontend timer, the server will
 * still enforce the inactivity policy.
 *
 * Timeline:
 * - Frontend warns at 30s inactivity, then 10s warning = 40s total
 * - Backend timeout must be LONGER than frontend total with generous buffer (60s)
 * - This 20s buffer accounts for network latency and processing time
 * - Each API request updates the lastActivity timestamp
 */

const INACTIVITY_TIMEOUT = 60 * 1000; // 60 seconds for testing (18 minutes for production: 18 * 60 * 1000)

/**
 * Middleware to track and enforce session activity timeout
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const sessionActivityMiddleware = (req, res, next) => {
	// Skip public endpoints (booking searches should work for everyone)
	const publicEndpoints = [
		"/api/rooms/available",
		"/api/rooms/recommended",
		"/api/rooms/",
		"/api/rooms",
	];

	// Check if current path is public
	const isPublicEndpoint = publicEndpoints.some(
		(endpoint) => req.path === endpoint || req.originalUrl.startsWith(endpoint)
	);

	if (isPublicEndpoint) {
		return next();
	}

	// Only apply to authenticated users
	if (!req.isAuthenticated || !req.isAuthenticated()) {
		return next();
	}

	const now = Date.now();

	// Check if lastActivity exists in session
	if (req.session.lastActivity) {
		const timeSinceLastActivity = now - req.session.lastActivity;

		// Log activity check for debugging
		console.log(
			`[Session Activity] User ${req.user?.email || req.user?.id || "unknown"} - ` +
			`Path: ${req.path} - Time since last activity: ${Math.floor(timeSinceLastActivity / 1000)}s ` +
			`(timeout: ${INACTIVITY_TIMEOUT / 1000}s)`
		);

		// If inactive for more than 10 minutes, destroy session
		if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
			console.log(
				`[Session Activity] ⏱️ User ${
					req.user?.id || "unknown"
				} session expired due to inactivity (${Math.floor(
					timeSinceLastActivity / 1000
				)}s)`
			);

			// Destroy the session
			return req.session.destroy((err) => {
				if (err) {
					console.error("[Session Activity] Error destroying session:", err);
				}

				// Clear the session cookie
				res.clearCookie("tioca.sid", {
					httpOnly: true,
					sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
					secure: process.env.NODE_ENV === "production",
				});

				// Return 401 Unauthorized
				return res.status(401).json({
					error: "Session expired due to inactivity",
					code: "SESSION_TIMEOUT",
				});
			});
		}
	}

	// Update last activity timestamp
	req.session.lastActivity = now;

	// Explicitly save the session to prevent race conditions
	// This ensures the updated lastActivity is persisted immediately
	// before the next request can check it
	req.session.save((err) => {
		if (err) {
			console.error("[Session Activity] ❌ Error saving session:", err);
			// Continue anyway - session might still work
		} else {
			console.log(
				`[Session Activity] ✅ Updated lastActivity for user ${
					req.user?.email || req.user?.id || "unknown"
				}`
			);
		}
		// Continue to next middleware
		next();
	});
};

/**
 * Initialize session activity tracking for a new session
 * Call this after successful login/authentication
 *
 * @param {object} req - Express request object with session
 */
export const initializeSessionActivity = (req) => {
	if (req.session) {
		req.session.lastActivity = Date.now();
		console.log(
			`[Session Activity] Initialized activity tracking for user ${
				req.user?.id || "unknown"
			}`
		);
		// Explicitly save to ensure it's persisted
		req.session.save((err) => {
			if (err) {
				console.error("[Session Activity] Error saving initial session:", err);
			}
		});
	}
};
