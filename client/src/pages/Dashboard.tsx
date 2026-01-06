import React, { useEffect, useState } from "react";
import { useGetHotelsQuery } from "../features/hotelsApi";
import type { Hotel } from "../types/hotel";

/**
 * Dashboard Page
 *
 * This page demonstrates fetching and displaying hotel data using RTK Query and Redux.
 *
 * - Uses relative API/auth paths so CloudFront can route requests to the backend in production.
 * - Session status is checked via /auth/loggedin (returns user info if logged in).
 * - Login and logout are handled via /auth/google and /auth/logout endpoints.
 *
 * Works both locally (with Vite dev proxy) and in AWS (with CloudFront behaviors).
 */
const Dashboard: React.FC = () => {
	// Fetch hotels from the API using RTK Query (auto-generated hook)
	const { data: hotels, error, isLoading } = useGetHotelsQuery(undefined);

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
				const res = await fetch("/auth/loggedin", {
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

	// Show loading state while fetching data
	if (isLoading)
		return (
			<div style={{ padding: "2rem", color: "var(--tioca-brown)" }}>
				Loading hotels...
			</div>
		);
	// Show error state if the request failed
	if (error)
		return (
			<div style={{ padding: "2rem", color: "var(--tioca-tan)" }}>
				Error loading hotels.
			</div>
		);

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
									await fetch("/auth/logout", {
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
			<h2 style={{ color: "var(--tioca-brown)", marginBottom: "1rem" }}>
				Hotels
			</h2>
			<ul
				style={{
					listStyle: "none",
					padding: 0,
					margin: 0,
				}}
			>
				{hotels && hotels.length > 0 ? (
					hotels.map((hotel: Hotel) => (
						<li
							key={hotel._id}
							style={{
								background: "white",
								padding: "1.5rem",
								marginBottom: "1rem",
								borderRadius: "8px",
								boxShadow: "0 2px 4px rgba(44, 22, 7, 0.1)",
								color: "var(--tioca-brown)",
							}}
						>
							<strong
								style={{ color: "var(--tioca-brown)", fontSize: "1.1rem" }}
							>
								{hotel.name}
							</strong>
							<div style={{ marginTop: "0.5rem", color: "var(--tioca-green)" }}>
								{hotel.address} ({hotel.category})
							</div>
						</li>
					))
				) : (
					<li style={{ color: "var(--tioca-brown)" }}>No hotels found.</li>
				)}
			</ul>
		</div>
	);
};

export default Dashboard;
