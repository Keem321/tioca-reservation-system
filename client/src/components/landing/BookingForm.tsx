import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, Users, Search } from "lucide-react";
import { setCheckIn, setCheckOut, setGuests } from "../../features/bookingSlice";
import { useSearchRoomsQuery } from "../../features/roomsApi";
import type { RootState } from "../../store";
import "./BookingForm.css";

/**
 * BookingForm Component
 *
 * Form for searching room availability.
 * Uses Redux to manage form state and RTK Query to search for rooms.
 */
const BookingForm: React.FC = () => {
	const dispatch = useDispatch();
	const { checkIn, checkOut, guests } = useSelector(
		(state: RootState) => state.booking
	);
	const [shouldSearch, setShouldSearch] = useState(false);

	// Validate form inputs
	const isValid =
		checkIn && checkOut && checkIn < checkOut && guests > 0;

	const { data, isLoading, error } = useSearchRoomsQuery(
		{
			checkIn,
			checkOut,
			guests,
		},
		{ skip: !shouldSearch || !isValid }
	);

	const handleSearch = () => {
		if (isValid) {
			setShouldSearch(true);
			// The query will run when shouldSearch becomes true
			// This could also navigate to a results page
			console.log("Searching for rooms...", { checkIn, checkOut, guests });
		}
	};

	// Reset search state when form values change
	React.useEffect(() => {
		setShouldSearch(false);
	}, [checkIn, checkOut, guests]);

	return (
		<div className="booking-form">
			<div className="booking-form__fields">
				<div className="booking-form__field">
					<label className="booking-form__label">Check In</label>
					<div className="booking-form__input-wrapper">
						<Calendar
							size={18}
							className="booking-form__icon"
						/>
						<input
							type="date"
							value={checkIn}
							onChange={(e) => dispatch(setCheckIn(e.target.value))}
							className="booking-form__input"
							min={new Date().toISOString().split("T")[0]}
						/>
					</div>
				</div>

				<div className="booking-form__field">
					<label className="booking-form__label">Check Out</label>
					<div className="booking-form__input-wrapper">
						<Calendar
							size={18}
							className="booking-form__icon"
						/>
						<input
							type="date"
							value={checkOut}
							onChange={(e) => dispatch(setCheckOut(e.target.value))}
							className="booking-form__input"
							min={checkIn || new Date().toISOString().split("T")[0]}
						/>
					</div>
				</div>

				<div className="booking-form__field">
					<label className="booking-form__label">Guests</label>
					<div className="booking-form__input-wrapper">
						<Users
							size={18}
							className="booking-form__icon"
						/>
						<select
							value={guests}
							onChange={(e) =>
								dispatch(setGuests(parseInt(e.target.value)))
							}
							className="booking-form__input booking-form__select"
						>
							{[1, 2, 3, 4].map((num) => (
								<option key={num} value={num}>
									{num} {num === 1 ? "Guest" : "Guests"}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<button
				onClick={handleSearch}
				disabled={!isValid || isLoading}
				className="booking-form__button"
			>
				<Search size={20} />
				{isLoading ? "Searching..." : "Search Availability"}
			</button>

			{error && (
				<div className="booking-form__error">
					Error searching for rooms. Please try again.
				</div>
			)}

			{data && data.rooms && data.rooms.length > 0 && (
				<div className="booking-form__success">
					Found {data.rooms.length} available room(s) for your dates!
				</div>
			)}
		</div>
	);
};

export default BookingForm;

