import { ReactNode } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface RoleGuardProps {
	requiredRoles: string | string[];
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * RoleGuard component - conditionally renders children based on user's role
 * Usage:
 *   <RoleGuard requiredRoles="manager">
 *     <ManagerPanel />
 *   </RoleGuard>
 *
 *   <RoleGuard requiredRoles={["manager", "admin"]} fallback={<AccessDenied />}>
 *     <ProtectedContent />
 *   </RoleGuard>
 */
export default function RoleGuard({
	requiredRoles,
	children,
	fallback = null,
}: RoleGuardProps) {
	const user = useSelector((state: RootState) => state.auth.user);

	const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

	// Check if user has one of the required roles
	const hasRole = user && roles.includes(user.role || "guest");

	return <>{hasRole ? children : fallback}</>;
}
