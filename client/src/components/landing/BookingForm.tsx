import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, Building } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { setCheckIn, setCheckOut, setZone } from "../../features/bookingSlice";
import { useGetRoomsQuery } from "../../features/roomsApi";
import { useGetReservationsQuery } from "../../features/reservationsApi";
import type { RootState } from "../../store";
import type { Room, PodFloor } from "../../types/room";
import type { Reservation } from "../../types/reservation";
import "./BookingForm.css";

/**
 * BookingForm Component
 *
 * Minimal booking form on the hero that navigates to the Booking page.
 */
const BookingForm: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { checkIn, checkOut, zone } = useSelector(
		(state: RootState) => state.booking
	);

	const isValid = Boolean(checkIn && checkOut && checkIn < checkOut && zone);
	const [searched, setSearched] = React.useState(false);

	// Fetch data when inputs are valid; results will populate after search
	const { data: roomsData } = useGetRoomsQuery(undefined, { skip: !isValid });
	const { data: reservationsData } = useGetReservationsQuery(undefined, {
		skip: !isValid,
	});
	const rooms = React.useMemo<Room[]>(() => roomsData ?? [], [roomsData]);
	const reservations = React.useMemo<Reservation[]>(
		() => reservationsData ?? [],
		[reservationsData]
	);

	// Reset searched flag when input changes
	React.useEffect(() => {
		setSearched(false);
	}, [checkIn, checkOut, zone]);

	const overlaps = React.useCallback(
		(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
			aStart < bEnd && aEnd > bStart,
		[]
	);

	const availableCount = React.useMemo(() => {
		if (!isValid || !searched) return 0;
		const windowStart = new Date(checkIn as string);
		const windowEnd = new Date(checkOut as string);
		const activeStatuses = new Set(["pending", "confirmed", "checked-in"]);

		const bookedRoomIds = new Set(
			reservations
				.filter((r) => activeStatuses.has(r.status))
				.filter((r) =>
					overlaps(
						new Date(r.checkInDate),
						new Date(r.checkOutDate),
						windowStart,
						windowEnd
					)
				)
				.filter((r) => r.roomId)
				.map((r) => (typeof r.roomId === "string" ? r.roomId : r.roomId!._id))
		);

		return rooms.filter((room) => {
			if (room.status === "maintenance") return false;
			if (bookedRoomIds.has(room._id)) return false;
			if (zone && room.floor !== zone) return false;
			return true;
		}).length;
	}, [
		isValid,
		searched,
		checkIn,
		checkOut,
		reservations,
		rooms,
		overlaps,
		zone,
	]);

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
				disabled={!isValid}
				className="booking-form__button"
			>
				{searched ? "Book Now" : "Search Availability"}
			</button>
			{searched && isValid && (
				<div className="booking-form__success">
					{availableCount} room(s) available for your dates
				</div>
			)}
		</div>
	);
};

export default BookingForm;
