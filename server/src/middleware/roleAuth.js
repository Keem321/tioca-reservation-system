/**
 * Role-based authorization middleware with role hierarchy
 * 
 * Role Hierarchy:
 * - admin: Full access (can do everything)
 * - manager: Operational access (view reservations, check-in/out, view reports)
 * - user: Standard guest access
 * 
 * Admins can access all manager endpoints (role inheritance).
 * 
 * Usage: 
 *   app.post('/rooms', requireRole('admin'), createRoom);
 *   app.get('/reservations', requireRole('manager'), getReservations);
 */

/**
 * Check if a user's role satisfies the required role(s)
 * Implements role hierarchy where admin can access manager endpoints
 * 
 * @param {string} userRole - The user's role
 * @param {string[]} requiredRoles - Array of allowed roles
 * @returns {boolean} True if user has sufficient permissions
 */
const hasRequiredRole = (userRole, requiredRoles) => {
	// Admin can access everything
	if (userRole === "admin") {
		return true;
	}

	// Otherwise, check if user's role is in the allowed roles
	return requiredRoles.includes(userRole);
};

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

		// Check if user has required role (with hierarchy support)
		if (!hasRequiredRole(req.user.role, roles)) {
			return res.status(403).json({
				error: `Insufficient permissions. Required role(s): ${roles.join(
					", "
				)}. Your role: ${req.user.role}`,
			});
		}

		next();
	};
};

/**
 * Convenience middleware to require admin role only
 * @returns {Function} Express middleware
 */
export const requireAdmin = () => requireRole("admin");

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
