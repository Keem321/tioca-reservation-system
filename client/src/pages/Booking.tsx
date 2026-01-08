import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
	useSearchAvailableRoomsQuery,
	useGetRecommendedRoomsQuery,
} from "../features/roomsApi";
import type { RootState } from "../store";
import BookingSearchForm from "../components/booking/BookingSearchForm";
import SearchResults from "../components/booking/SearchResults";
import Navbar from "../components/landing/Navbar";
import PodCard from "../components/booking/PodCard";
import "./Booking.css";

/**
 * Booking Page Component
 *
 * Main booking page that allows users to search for and book available pods.
 * Uses RTK Query for data fetching and Redux for state management.
 */

const Booking: React.FC = () => {
	const { checkIn, checkOut, zone } = useSelector(
		(state: RootState) => state.booking
	);
	const [shouldSearch, setShouldSearch] = useState(false);

	// Search for available rooms
	const {
		data: searchResults = [],
		isLoading: isSearching,
		error: searchError,
	} = useSearchAvailableRoomsQuery(
		{
			checkIn: checkIn || "",
			checkOut: checkOut || "",
			floor: zone || undefined,
		},
		{
			skip: !shouldSearch || !checkIn || !checkOut || !zone,
		}
	);

	// Get recommended rooms
	const { data: recommendedResults = [] } = useGetRecommendedRoomsQuery(
		{
			checkIn: checkIn || "",
			checkOut: checkOut || "",
			floor: zone || undefined,
		},
		{
			skip: !shouldSearch || !checkIn || !checkOut || !zone,
		}
	);

	const handleSearch = () => {
		if (checkIn && checkOut && checkIn < checkOut && zone) {
			setShouldSearch(true);
		}
	};

	// Reset search when form values change
	useEffect(() => {
		setShouldSearch(false);
	}, [checkIn, checkOut, zone]);

	const getNights = () => {
		if (!checkIn || !checkOut) return 0;
		const start = new Date(checkIn);
		const end = new Date(checkOut);
		return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
	};

	return (
		<div className="booking-page">
			<Navbar />
			<div className="booking-page__container">
				<div className="booking-page__header">
					<h1 className="booking-page__title">Book Your Stay</h1>
					<p className="booking-page__subtitle">
						Find your perfect capsule in Tokyo
					</p>
				</div>

				<BookingSearchForm onSearch={handleSearch} isSearching={isSearching} />

				{searchError && (
					<div className="booking-page__error">
						Error searching for pods. Please try again.
					</div>
				)}

				{shouldSearch && !isSearching && (
					<>
						<SearchResults
							results={searchResults}
							nights={getNights()}
							checkIn={checkIn}
							checkOut={checkOut}
						/>

						{recommendedResults.length > 0 && (
							<div className="booking-page__recommendations">
								<h2 className="booking-page__recommendations-title">
									Recommended Options
								</h2>
								<p className="booking-page__recommendations-subtitle">
									These rooms are partially available or on alternative floors
								</p>
								<div className="search-results__grid">
									{recommendedResults.map((room: any) => (
										<div key={room._id} className="recommended-pod">
											<PodCard
												pod={room}
												nights={getNights()}
												checkIn={checkIn}
												checkOut={checkOut}
											/>
											{room.availabilityInfo && (
												<div className="recommended-pod__badge">
													{room.availabilityInfo.isAlternativeFloor
														? `Available on ${room.floor} floor`
														: `${room.availabilityInfo.availablePercent}% of dates available`}
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default Booking;
