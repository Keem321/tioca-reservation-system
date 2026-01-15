import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../hooks";
import { Calendar, Building } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { setCheckIn, setCheckOut, setZone } from "../../features/bookingSlice";
import { useGetRoomsQuery } from "../../features/roomsApi";
// RootState type not needed due to typed selector hook
import type { BookingState } from "../../features/bookingSlice";
import type { PodFloor } from "../../types/room";
import "./BookingForm.css";

/**
 * BookingForm Component
 *
 * Minimal booking form on the hero that navigates to the Booking page.
 * Uses public availability endpoint to check room availability for guests.
 */
const BookingForm: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { checkIn, checkOut, zone } = useAppSelector(
		(state) => state.booking as BookingState
	);

	const isValid = Boolean(checkIn && checkOut && checkIn < checkOut && zone);
	const [searched, setSearched] = React.useState(false);
	const [availableCount, setAvailableCount] = React.useState<number | null>(
		null
	);
	const [loading, setLoading] = React.useState(false);

	// Fetch availability from public endpoint when search is clicked
	React.useEffect(() => {
		if (!searched || !isValid) {
			return;
		}

		const fetchAvailability = async () => {
			setLoading(true);
			try {
				const apiUrl = import.meta.env.VITE_API_URL || "";
				const response = await fetch(
					`${apiUrl}/api/reservations/availability/count?checkIn=${checkIn}&checkOut=${checkOut}&floor=${zone}`,
					{
						credentials: "include",
					}
				);

				if (!response.ok) {
					throw new Error("Failed to check availability");
				}

				const data = await response.json();
				setAvailableCount(data.availableCount);
			} catch (error) {
				console.error("[BookingForm] Error checking availability:", error);
				setAvailableCount(0);
			} finally {
				setLoading(false);
			}
		};

		fetchAvailability();
	}, [searched, isValid, checkIn, checkOut, zone]);

	// Reset searched flag when input changes
	React.useEffect(() => {
		setSearched(false);
		setAvailableCount(null);
	}, [checkIn, checkOut, zone]);

	const handlePrimary = () => {
		if (!isValid) return;
		if (!searched) {
			setSearched(true);
			return;
		}
		navigate("/booking");
	};

	return (
		<div className="booking-form">
			<div className="booking-form__fields">
				<div className="booking-form__field">
					<label className="booking-form__label">Check In</label>
					<div className="booking-form__input-wrapper">
						<Calendar size={18} className="booking-form__icon" />
						<DatePicker
							selected={checkIn ? new Date(checkIn) : null}
							onChange={(date: Date | null) =>
								dispatch(
									setCheckIn(date ? date.toISOString().split("T")[0] : "")
								)
							}
							minDate={new Date()}
							maxDate={checkOut ? new Date(checkOut) : undefined}
							dateFormat="MM/dd/yyyy"
							placeholderText="mm/dd/yyyy"
							className="booking-form__input"
							wrapperClassName="booking-form__datepicker-wrapper"
							calendarClassName="booking-form__calendar"
						/>
					</div>
				</div>

				<div className="booking-form__field">
					<label className="booking-form__label">Check Out</label>
					<div className="booking-form__input-wrapper">
						<Calendar size={18} className="booking-form__icon" />
						<DatePicker
							selected={checkOut ? new Date(checkOut) : null}
							onChange={(date: Date | null) =>
								dispatch(
									setCheckOut(date ? date.toISOString().split("T")[0] : "")
								)
							}
							minDate={checkIn ? new Date(checkIn) : new Date()}
							dateFormat="MM/dd/yyyy"
							placeholderText="mm/dd/yyyy"
							className="booking-form__input"
							wrapperClassName="booking-form__datepicker-wrapper"
							calendarClassName="booking-form__calendar"
						/>
					</div>
				</div>

				<div className="booking-form__field">
					<label className="booking-form__label">Floor</label>
					<div className="booking-form__input-wrapper">
						<Building size={18} className="booking-form__icon" />
						<select
							value={zone}
							onChange={(e) => dispatch(setZone(e.target.value as PodFloor))}
							className="booking-form__input booking-form__select"
						>
							<option value="" disabled>
								Select Floor
							</option>
							<option value="women-only">Women Only</option>
							<option value="men-only">Men Only</option>
							<option value="couples">Couples</option>
							<option value="business">Business</option>
						</select>
					</div>
				</div>
			</div>

			<button
				onClick={handlePrimary}
				disabled={!isValid || (searched && loading)}
				className="booking-form__button"
			>
				{loading
					? "Checking Availability..."
					: searched
					? "Book Now"
					: "Search Availability"}
			</button>
			{searched && isValid && (
				<div className="booking-form__success">
					{availableCount !== null
						? `${availableCount} room(s) available for your dates`
						: "Loading availability..."}
				</div>
			)}
		</div>
	);
};

export default BookingForm;
