import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { hasRequiredRole, type UserRole } from "../utils/roleUtils";

interface ProtectedRouteProps {
	children: React.ReactNode;
	requiredRole?: UserRole | UserRole[];
}

/**
 * ProtectedRoute Component
 *
 * Restricts access to routes based on authentication and optionally role.
 * - Redirects unauthenticated users to /login
 * - Redirects users without required role to /
 * - Supports role hierarchy (admin can access manager routes)
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	requiredRole,
}) => {
	const user = useSelector((state: RootState) => state.auth.user);
	const isLoading = useSelector((state: RootState) => state.auth.isLoading);
	const hasChecked = useSelector((state: RootState) => state.auth.hasChecked);

	// Still loading auth state
	if (isLoading || !hasChecked) {
		return (
			<div style={{ padding: "2rem", textAlign: "center" }}>
				<p>Loading...</p>
			</div>
		);
	}

	// Not authenticated
	if (!user) {
		return <Navigate to="/login" replace />;
	}

	// Authenticated but doesn't have required role (with hierarchy support)
	if (requiredRole && !hasRequiredRole(user.role as UserRole, requiredRole)) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
};

export default ProtectedRoute;
