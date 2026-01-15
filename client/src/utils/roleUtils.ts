/**
 * Role Utilities
 * 
 * Provides role hierarchy checking for the frontend.
 * Matches the backend role hierarchy where admin can access everything.
 */

export type UserRole = "admin" | "manager" | "user" | "guest";

/**
 * Check if a user's role satisfies the required role(s)
 * Implements role hierarchy where admin can access manager endpoints
 * 
 * @param userRole - The user's role
 * @param requiredRoles - Single role or array of allowed roles
 * @returns True if user has sufficient permissions
 */
export const hasRequiredRole = (
	userRole: UserRole | undefined | null,
	requiredRoles: UserRole | UserRole[]
): boolean => {
	if (!userRole) {
		return false;
	}

	// Admin can access everything
	if (userRole === "admin") {
		return true;
	}

	// Convert to array for consistent checking
	const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

	// Check if user's role is in the allowed roles
	return roles.includes(userRole);
};

/**
 * Check if user is an admin
 * @param userRole - The user's role
 * @returns True if user is admin
 */
export const isAdmin = (userRole: UserRole | undefined | null): boolean => {
	return userRole === "admin";
};

/**
 * Check if user is a manager (or admin)
 * @param userRole - The user's role
 * @returns True if user is manager or admin
 */
export const isManagerOrAbove = (userRole: UserRole | undefined | null): boolean => {
	return hasRequiredRole(userRole, "manager");
};
