import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { hasRequiredRole, type UserRole } from "../utils/roleUtils";

interface RoleGuardProps {
	requiredRoles: UserRole | UserRole[];
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * RoleGuard component - conditionally renders children based on user's role
 * Supports role hierarchy where admin can access manager content.
 *
 * Usage:
 *   <RoleGuard requiredRoles="manager">
 *     <ManagerPanel />
 *   </RoleGuard>
 *
 *   <RoleGuard requiredRoles={["manager", "admin"]} fallback={<AccessDenied />}>
 *     <ProtectedContent />
 *   </RoleGuard>
 *
 *   <RoleGuard requiredRoles="admin">
 *     <DeleteButton />
 *   </RoleGuard>
 */
export default function RoleGuard({
	requiredRoles,
	children,
	fallback = null,
}: RoleGuardProps) {
	const user = useSelector((state: RootState) => state.auth.user);

	// Check if user has required role (with hierarchy support)
	const hasRole = hasRequiredRole(user?.role as UserRole, requiredRoles);

	return <>{hasRole ? children : fallback}</>;
}
