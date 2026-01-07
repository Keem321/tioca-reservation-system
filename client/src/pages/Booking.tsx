import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useGetHotelsQuery } from "../features/hotelsApi";
import { useSearchAvailableRoomsQuery } from "../features/roomsApi";
import type { RootState } from "../store";
import BookingSearchForm from "../components/booking/BookingSearchForm";
import SearchResults from "../components/booking/SearchResults";
import Navbar from "../components/landing/Navbar";
import "./Booking.css";

/**
 * Booking Page Component
 *
 * Main booking page that allows users to search for and book available pods.
 * Uses RTK Query for data fetching and Redux for state management.
 */

const Booking: React.FC = () => {
	const { checkIn, checkOut, zone, quality } = useSelector(
		(state: RootState) => state.booking
	);
	const [shouldSearch, setShouldSearch] = useState(false);
	const [selectedHotelId, setSelectedHotelId] = useState<string>("");

	// Fetch hotels to get the hotel ID
	const { data: hotels = [] } = useGetHotelsQuery(undefined);

	// Set default hotel ID when hotels are loaded
	useEffect(() => {
		if (hotels.length > 0 && !selectedHotelId) {
			setSelectedHotelId(hotels[0]._id);
		}
	}, [hotels, selectedHotelId]);

	// Search for available rooms
	const {
		data: searchResults = [],
		isLoading: isSearching,
		error: searchError,
	} = useSearchAvailableRoomsQuery(
		{
			hotelId: selectedHotelId,
			checkIn: checkIn || "",
			checkOut: checkOut || "",
			floor: zone || undefined,
			quality: quality || undefined,
		},
		{
			skip: !shouldSearch || !checkIn || !checkOut || !zone || !selectedHotelId,
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
	}, [checkIn, checkOut, zone, quality]);

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

				<BookingSearchForm
					onSearch={handleSearch}
					isSearching={isSearching}
				/>

				{searchError && (
					<div className="booking-page__error">
						Error searching for pods. Please try again.
					</div>
				)}

				{shouldSearch && !isSearching && (
					<SearchResults
						results={searchResults}
						nights={getNights()}
						checkIn={checkIn}
						checkOut={checkOut}
					/>
				)}
			</div>
		</div>
	);
};

export default Booking;

