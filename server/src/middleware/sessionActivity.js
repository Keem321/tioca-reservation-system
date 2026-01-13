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
 * - 10 minutes of inactivity → session is destroyed, 401 returned
 * - Each API request updates the lastActivity timestamp
 */

const INACTIVITY_TIMEOUT = 30 * 1000; // 10 minutes in milliseconds

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
		'/api/rooms/available',
		'/api/rooms/recommended',
		'/api/rooms/',
		'/api/rooms',
	];
	
	// Check if current path is public
	const isPublicEndpoint = publicEndpoints.some(endpoint => 
		req.path === endpoint || req.originalUrl.startsWith(endpoint)
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

		// If inactive for more than 10 minutes, destroy session
		if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
			console.log(
				`[Session Activity] User ${req.user?.id || 'unknown'} session expired due to inactivity (${Math.floor(timeSinceLastActivity / 1000)}s)`
			);

			// Destroy the session
			return req.session.destroy((err) => {
				if (err) {
					console.error('[Session Activity] Error destroying session:', err);
				}

				// Clear the session cookie
				res.clearCookie('tioca.sid', {
					httpOnly: true,
					sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
					secure: process.env.NODE_ENV === 'production',
				});

				// Return 401 Unauthorized
				return res.status(401).json({
					error: 'Session expired due to inactivity',
					code: 'SESSION_TIMEOUT',
				});
			});
		}
	}

	// Update last activity timestamp
	req.session.lastActivity = now;

	// Continue to next middleware
	next();
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
		console.log(`[Session Activity] Initialized activity tracking for user ${req.user?.id || 'unknown'}`);
	}
};
