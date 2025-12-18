import React from "react";
import { useGetHotelsQuery } from "../features/hotelsApi";
import type { Hotel } from "../types/hotel";

/**
 * Dashboard Page
 *
 * This page demonstrates fetching and displaying hotel data using RTK Query and Redux.
 *
 * RTK Query defines API endpoints and auto-generates React hooks for queries and mutations.
 *
 * useGetHotelsQuery is an auto-generated hook from our hotelsApi slice.
 *
 */
const Dashboard: React.FC = () => {
	// Call the RTK Query hook to fetch hotels from the API.
	// The argument is undefined because our endpoint does not require parameters.
	// Returns { data, error, isLoading } for easy UI state management.
	const { data: hotels, error, isLoading } = useGetHotelsQuery(undefined);

	// Show loading state while fetching data
	if (isLoading) return <div>Loading hotels...</div>;
	// Show error state if the request failed
	if (error) return <div>Error loading hotels.</div>;

	// Render the list of hotels, or a message if none are found
	return (
		<div>
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
