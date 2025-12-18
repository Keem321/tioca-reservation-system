import React from "react";
import { useGetHotelsQuery } from "../features/hotelsApi";

const Dashboard: React.FC = () => {
	const { data: hotels, error, isLoading } = useGetHotelsQuery();

	if (isLoading) return <div>Loading hotels...</div>;
	if (error) return <div>Error loading hotels.</div>;

	return (
		<div>
			<h2>Hotels</h2>
			<ul>
				{hotels && hotels.length > 0 ? (
					hotels.map((hotel: any) => (
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
