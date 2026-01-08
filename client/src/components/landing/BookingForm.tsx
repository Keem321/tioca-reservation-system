import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, Users } from "lucide-react";
import {
	setCheckIn,
	setCheckOut,
	setGuests,
} from "../../features/bookingSlice";
import { useGetRoomsQuery } from "../../features/roomsApi";
import { useGetReservationsQuery } from "../../features/reservationsApi";
import type { RootState } from "../../store";
import type { Room } from "../../types/room";
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
	const { checkIn, checkOut, guests } = useSelector(
		(state: RootState) => state.booking
	);

	const isValid = Boolean(
		checkIn && checkOut && checkIn < checkOut && guests > 0
	);
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
	}, [checkIn, checkOut, guests]);

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
				.map((r) => (typeof r.roomId === "string" ? r.roomId : r.roomId._id))
		);

		return rooms.filter((room) => {
			if (room.status === "maintenance") return false;
			if (bookedRoomIds.has(room._id)) return false;
			const capacity = room.capacity ?? (room.floor === "couples" ? 2 : 1);
			return capacity >= guests;
		}).length;
	}, [
		isValid,
		searched,
		checkIn,
		checkOut,
		reservations,
		rooms,
		overlaps,
		guests,
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
						<Calendar size={18} className="booking-form__icon" />
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
					<label className="booking-form__label">Guests (Max 2)</label>
					<div className="booking-form__input-wrapper">
						<Users size={18} className="booking-form__icon" />
						<select
							value={guests}
							onChange={(e) => dispatch(setGuests(parseInt(e.target.value)))}
							className="booking-form__input booking-form__select"
						>
							<option value={1}>1 Guest</option>
							<option value={2}>2 Guests</option>
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
