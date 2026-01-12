import React, { useEffect, useState } from "react";

/**
 * Dashboard Page
 *
 *
 *
 * - Uses relative API/auth paths so CloudFront can route requests to the backend in production.
 * - Session status is checked via /auth/loggedin (returns user info if logged in).
 * - Login and logout are handled via /auth/google and /auth/logout endpoints.
 *
 * Works both locally (with Vite dev proxy) and in AWS (with CloudFront behaviors).
 */
const Dashboard: React.FC = () => {
	// Track login state and user info
	const [loggedIn, setLoggedIn] = useState(false);
	const [user, setUser] = useState<{
		id?: string;
		name?: string;
		email?: string;
	} | null>(null);

	// On mount, check session status by calling /auth/loggedin
	useEffect(() => {
		const check = async () => {
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "";
				const res = await fetch(`${apiUrl}/auth/loggedin`, {
					credentials: "include",
				});
				if (res.ok) {
					const body = await res.json();
					setLoggedIn(true);
					setUser(body.user || null);
				}
			} catch (err) {
				console.error("Failed to check session:", err);
			}
		};
		check();
	}, []);

	// Render the dashboard UI
	return (
		<div style={{ maxWidth: "1200px", margin: "0 auto" }}>
			{/* Auth section: shows login or logout depending on session */}
			<div
				style={{
					marginBottom: "2rem",
					padding: "1rem",
					background: "white",
					borderRadius: "8px",
					boxShadow: "0 2px 4px rgba(44, 22, 7, 0.1)",
				}}
			>
				{loggedIn ? (
					<span style={{ color: "var(--tioca-brown)" }}>
						Logged in{user ? ` as ${user.name || user.email}` : ""}
						<button
							style={{
								marginLeft: "1rem",
								background: "var(--tioca-tan)",
								color: "var(--tioca-beige)",
								border: "none",
								padding: "0.5rem 1rem",
								borderRadius: "6px",
								cursor: "pointer",
							}}
							onClick={async () => {
								try {
									const apiUrl = import.meta.env.VITE_API_URL || "";
									await fetch(`${apiUrl}/auth/logout`, {
										method: "POST",
										credentials: "include",
									});
								} catch (err) {
									console.error("Logout failed:", err);
								}
								setLoggedIn(false);
								setUser(null);
							}}
						>
							Logout
						</button>
					</span>
				) : (
					<a
						href="/auth/google"
						style={{
							color: "var(--tioca-blue)",
							textDecoration: "none",
							fontWeight: "500",
						}}
					>
						Login with Google
					</a>
				)}
			</div>
		</div>
	);
};

export default Dashboard;
