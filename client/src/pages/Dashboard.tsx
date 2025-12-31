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
				// ignore network errors
			}
		};
		check();
	}, []);

	// Show loading state while fetching data
	if (isLoading) return <div>Loading hotels...</div>;
	// Show error state if the request failed
	if (error) return <div>Error loading hotels.</div>;

	// Render the dashboard UI
	return (
		<div>
			{/* Auth section: shows login or logout depending on session */}
			<div style={{ marginBottom: 12 }}>
				{loggedIn ? (
					<span>
						logged in{user ? ` as ${user.name || user.email}` : ""}
						<button
							style={{ marginLeft: 8 }}
							onClick={async () => {
								try {
									await fetch("/auth/logout", {
										method: "POST",
										credentials: "include",
									});
								} catch (e) {
									// ignore
								}
								setLoggedIn(false);
								setUser(null);
							}}
						>
							Logout
						</button>
					</span>
				) : (
					<a href="/auth/google">Login with Google</a>
				)}
			</div>
			<h2>Hotels</h2>
			<ul>
				{hotels && hotels.length > 0 ? (
					hotels.map((hotel: Hotel) => (
						<li key={hotel._id}>
							<strong>{hotel.name}</strong> - {hotel.address} ({hotel.category})
						</li>
					))
				) : (
					<li>No hotels found.</li>
				)}
			</ul>
		</div>
	);
};

export default Dashboard;
