import React from "react";
import { useGetRoomsQuery } from "../../features/roomsApi";
import type { Room, PodQuality } from "../../types/room";
import "./RoomsSection.css";

/**
 * Display data interface for room cards
 */
interface RoomDisplay {
	id: string;
	name: string;
	price: number;
	features: string;
	available: boolean;
	capacity: number;
}

/**
 * Map pod quality to display name
 */
const getQualityDisplayName = (quality: PodQuality): string => {
	const qualityMap: Record<PodQuality, string> = {
		classic: "Classic Pearl",
		milk: "Milk Pearl",
		golden: "Golden Pearl",
		crystal: "Crystal Boba",
		matcha: "Matcha Pearl",
	};
	return qualityMap[quality];
};

/**
 * Convert API Room to display format
 */
const mapRoomToDisplay = (room: Room): RoomDisplay => ({
	id: room._id,
	name: getQualityDisplayName(room.quality),
	price: room.pricePerNight,
	features: room.description || "Comfortable capsule accommodation",
	available: room.status === "available",
	capacity: room.capacity,
});

/**
 * RoomsSection Component
 *
 * Displays available room types with pricing and features.
 * Uses RTK Query to fetch room data from the API.
 */
const RoomsSection: React.FC = () => {
	const { data: rooms, isLoading, error } = useGetRoomsQuery(void 0);

	// Fallback data if API is not ready
	const fallbackRooms: RoomDisplay[] = [
		{
			id: "1",
			name: "Classic Pearl",
			price: 65,
			features: "Private single capsule with essential amenities for short, efficient stays",
			available: true,
			capacity: 1,
		},
		{
			id: "2",
			name: "Milk Pearl",
			price: 75,
			features: "Enhanced single capsule with extra space, workspace surface, and premium bedding",
			available: true,
			capacity: 2,
		},
		{
			id: "3",
			name: "Golden Pearl",
			price: 95,
			features: "Spacious premium capsule allowing upright seating and additional private storage",
			available: false,
			capacity: 2,
		},
		{
			id: "4",
			name: "Matcha Pearl",
			price: 65,
			features: "Women-only premium capsule with spacious layout and enhanced privacy features",
			available: false,
			capacity: 2,
		},
		{
			id: "5",
			name: "Twin Pearl",
			price: 110,
			features: "Wide shared capsule designed comfortably for two adults traveling together",
			available: false,
			capacity: 2,
		},
		{
			id: "6",
			name: "Crystal Boba",
			price: 155,
			features: "First-class private suite with standing room, desk, and premium amenities",
			available: false,
			capacity: 2,
		},
	];

	const displayRooms: RoomDisplay[] = 
		rooms && rooms.length > 0 
			? rooms.map(mapRoomToDisplay) 
			: fallbackRooms;

	return (
		<section id="rooms" className="rooms-section">
			<div className="rooms-section__container">
				<h2 className="rooms-section__title">Our Capsules</h2>

				{isLoading && <div className="rooms-section__loading">Loading rooms...</div>}
				{error && (
					<div className="rooms-section__error">
						Error loading rooms. Showing sample data.
					</div>
				)}

				<div className="rooms-section__grid">
					{displayRooms.map((room) => (
						<div key={room.id} className="rooms-section__card">
							<div className="rooms-section__card-image">
								{room.name[0]}
							</div>
							<div className="rooms-section__card-content">
								<div className="rooms-section__card-header">
									<h3 className="rooms-section__card-title">
										{room.name}
									</h3>
									<span className="rooms-section__card-price">
										${room.price}
									</span>
								</div>
								<p className="rooms-section__card-features">
									{room.features}
								</p>
								<div className="rooms-section__card-availability">
									<span
										className={`rooms-section__availability-dot ${
											room.available
												? "rooms-section__availability-dot--available"
												: "rooms-section__availability-dot--limited"
										}`}
									></span>
									<span
										className={`rooms-section__availability-text ${
											room.available
												? "rooms-section__availability-text--available"
												: "rooms-section__availability-text--limited"
										}`}
									>
										{room.available ? "Available" : "Limited"}
									</span>
								</div>
								<button className="rooms-section__card-button">
									View Details
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default RoomsSection;

