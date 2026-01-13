/**
 * Role-based authorization middleware
 * Usage: app.use('/admin', requireRole('manager'), adminRoutes);
 *        app.post('/rooms', requireRole('manager'), createRoom);
 */

/**
 * Middleware factory to require a specific role
 * @param {string|string[]} requiredRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (requiredRoles) => {
	const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

	return (req, res, next) => {
		// Check if user is authenticated
		if (!req.user) {
			return res.status(401).json({ error: "Not authenticated" });
		}

		// Check if user's role is in the allowed roles
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				error: `Insufficient permissions. Required role(s): ${roles.join(
					", "
				)}`,
			});
		}

		next();
	};
};

/**
 * Middleware to check if user is authenticated (any logged-in user)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export const requireAuth = (req, res, next) => {
	if (!req.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}
	next();
};
