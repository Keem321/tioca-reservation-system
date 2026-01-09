import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
	useCreateReservationMutation,
	useGetAvailableSlotsQuery,
} from "../features/reservationsApi";
import { setPendingReservation, resetBooking } from "../features/bookingSlice";
import type { RootState } from "../store";
import type { ReservationFormData } from "../types/reservation";
import Navbar from "../components/landing/Navbar";
import {
	getRoomImage,
	getRoomDisplayLabel,
	getRoomQualityDescription,
} from "../utils/roomImages";
import "./BookingConfirmation.css";

/**
 * BookingConfirmation Component
 *
 * Displays booking confirmation details and collects guest information.
 * Works for both authenticated users and guests.
 * Creates the reservation when proceeding to payment.
 */
const BookingConfirmation: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const { checkIn, checkOut, guests, selectedRoom } = useSelector(
		(state: RootState) => state.booking
	);
	const { user } = useSelector((state: RootState) => state.auth);

	// Guest information form state
	const [guestName, setGuestName] = useState(user?.name || "");
	const [guestEmail, setGuestEmail] = useState(user?.email || "");
	const [guestPhone, setGuestPhone] = useState("");

	// Time selection state
	const [checkInTime, setCheckInTime] = useState("");
	const [checkOutTime, setCheckOutTime] = useState("");
	const [timeError, setTimeError] = useState("");

	// Get room from location state or Redux
	const room = location.state?.room || selectedRoom;

	const { data: checkInSlotsData, isFetching: loadingCheckInSlots } =
		useGetAvailableSlotsQuery(
			{ roomId: room?._id || "", date: checkIn || "" },
			{ skip: !room || !checkIn }
		);

	const { data: checkOutSlotsData, isFetching: loadingCheckOutSlots } =
		useGetAvailableSlotsQuery(
			{ roomId: room?._id || "", date: checkOut || "" },
			{ skip: !room || !checkOut }
		);

	// Helper to convert 24-hour time to 12-hour AM/PM format
	const formatTimeAmPm = (time24: string): string => {
		const [hour, minute] = time24.split(":");
		const hourNum = parseInt(hour);
		const ampm = hourNum >= 12 ? "PM" : "AM";
		const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
		return `${hour12}:${minute} ${ampm}`;
	};

	// Helper to convert 12-hour AM/PM back to 24-hour for time comparison
	const convertAmPmTo24 = (timeAmPm: string): string => {
		const [time, ampm] = timeAmPm.split(" ");
		const [hour, minute] = time.split(":");
		let hourNum = parseInt(hour);
		if (ampm === "AM" && hourNum === 12) hourNum = 0;
		if (ampm === "PM" && hourNum !== 12) hourNum += 12;
		return `${String(hourNum).padStart(2, "0")}:${minute}`;
	};

	// Derive slots from query data and convert to AM/PM
	const checkInSlots = (checkInSlotsData?.slots || []).map(formatTimeAmPm);
	const rawCheckOutSlots = (checkOutSlotsData?.slots || []).map(formatTimeAmPm);
	const checkoutSlots =
		checkIn === checkOut && checkInTime
			? rawCheckOutSlots.filter((slot) => {
					const slotIn24 = convertAmPmTo24(slot);
					const checkInIn24 = convertAmPmTo24(checkInTime);
					return slotIn24 > checkInIn24;
			  })
			: rawCheckOutSlots;

	const [createReservation, { isLoading, error }] =
		useCreateReservationMutation();

	// Redirect if no room selected or missing booking data
	useEffect(() => {
		if (!room || !checkIn || !checkOut) {
			navigate("/booking");
		}
	}, [room, checkIn, checkOut, navigate]);

	const handleProceedToPayment = async () => {
		if (
			!room ||
			!checkIn ||
			!checkOut ||
			!guestName ||
			!guestEmail ||
			!checkInTime ||
			!checkOutTime
		) {
			setTimeError("Please select check-in and check-out times.");
			return;
		}

		const isSameDayCheckout = checkIn === checkOut;
		if (isSameDayCheckout && checkOutTime <= checkInTime) {
			setTimeError("Check-out time must be after check-in time.");
			return;
		}

		setTimeError("");

		// Calculate total price (use local date parsing to avoid timezone shifts)
		const checkInDate = toLocalDate(checkIn);
		const checkOutDate = toLocalDate(checkOut);
		const nights = Math.ceil(
			(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
		);
		const totalPrice = room.pricePerNight * nights;

		const checkInDateTime = combineDateTime(checkIn, checkInTime);
		const checkOutDateTime = combineDateTime(checkOut, checkOutTime);

		const reservationData: ReservationFormData = {
			roomId: room._id,
			userId: user?.id,
			guestName,
			guestEmail,
			guestPhone: guestPhone || undefined,
			checkInDate: checkInDateTime,
			checkOutDate: checkOutDateTime,
			numberOfGuests: guests,
			totalPrice,
			status: "pending",
			paymentStatus: "unpaid",
		};

		try {
			const reservation = await createReservation(reservationData).unwrap();
			dispatch(setPendingReservation(reservation));
			navigate("/payment");
		} catch (err) {
			console.error("Failed to create reservation:", err);
		}
	};

	const handleCancel = () => {
		dispatch(resetBooking());
		navigate("/booking");
	};

	if (!room || !checkIn || !checkOut) {
		return null;
	}

	// Parse dates as local to avoid timezone shifts from Date parsing of YYYY-MM-DD
	const toLocalDate = (value: string) => new Date(`${value}T00:00:00`);
	const combineDateTime = (date: string, time: string) => {
		const time24 = convertAmPmTo24(time);
		return `${date}T${time24}:00`;
	};

	const isCheckInToday = (() => {
		const today = new Date();
		const checkInDateLocal = toLocalDate(checkIn);
		return today.toDateString() === checkInDateLocal.toDateString();
	})();

	// Calculate booking details
	const checkInDate = toLocalDate(checkIn);
	const checkOutDate = toLocalDate(checkOut);
	const nights = Math.ceil(
		(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
	);
	const totalPrice = room.pricePerNight * nights;
	const roomImage = getRoomImage(room.quality, room.floor);
	const roomLabel = getRoomDisplayLabel(room.quality, room.floor);
	const roomDescription = getRoomQualityDescription(room.quality);

	return (
		<>
			<Navbar />
			<div className="booking-confirmation">
				<div className="booking-confirmation__container">
					<div className="booking-confirmation__header">
						<h1>Confirm Your Booking</h1>
						<p className="booking-confirmation__subtitle">
							Please review your reservation details before proceeding to
							payment
						</p>
					</div>

					{/* Guest Information Form */}
					<div className="booking-confirmation__section">
						<h2>Guest Information</h2>
						<div className="guest-form">
							<div className="form-group">
								<label htmlFor="guestName">Full Name *</label>
								<input
									id="guestName"
									type="text"
									value={guestName}
									onChange={(e) => setGuestName(e.target.value)}
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="guestEmail">Email Address *</label>
								<input
									id="guestEmail"
									type="email"
									value={guestEmail}
									onChange={(e) => setGuestEmail(e.target.value)}
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="guestPhone">Phone Number</label>
								<input
									id="guestPhone"
									type="tel"
									value={guestPhone}
									onChange={(e) => setGuestPhone(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{/* Check-In/Out Time Selection */}
					<div className="booking-confirmation__section">
						<h2>Arrival & Departure Times</h2>
						{isCheckInToday && (
							<p className="booking-confirmation__notice">
								Note: At least 2 hours are needed to prepare the room before
								arrival.
							</p>
						)}
						<div className="guest-form">
							<div className="form-group">
								<label htmlFor="checkInTime">
									Arrival Time on{" "}
									{new Date(checkIn + "T00:00:00").toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})}{" "}
									*
								</label>
								{loadingCheckInSlots ? (
									<p>Loading available times...</p>
								) : (
									<select
										id="checkInTime"
										value={checkInTime}
										onChange={(e) => setCheckInTime(e.target.value)}
										required
									>
										<option value="">Select a time</option>
										{checkInSlots.map((slot) => (
											<option key={slot} value={slot}>
												{slot}
											</option>
										))}
									</select>
								)}
							</div>
							<div className="form-group">
								<label htmlFor="checkOutTime">
									Departure Time on{" "}
									{new Date(checkOut + "T00:00:00").toLocaleDateString(
										"en-US",
										{ month: "short", day: "numeric" }
									)}{" "}
									*
								</label>
								{loadingCheckOutSlots ? (
									<p>Loading available times...</p>
								) : (
									<select
										id="checkOutTime"
										value={checkOutTime}
										onChange={(e) => setCheckOutTime(e.target.value)}
										required
									>
										<option value="">Select a time</option>
										{checkoutSlots.map((slot) => (
											<option key={slot} value={slot}>
												{slot}
											</option>
										))}
									</select>
								)}
							</div>
						</div>
						{timeError && (
							<p className="booking-confirmation__error">{timeError}</p>
						)}
					</div>

					{error && (
						<div className="booking-confirmation__error">
							{(error as { data?: { error?: string } })?.data?.error ||
								"Failed to create reservation. Please try again."}
						</div>
					)}

					{checkInTime && checkOutTime && (
						<div className="booking-confirmation__content">
							{/* Room Details */}
							<div className="booking-confirmation__section">
								<h2>Room Details</h2>
							<div className="booking-confirmation__room-image">
								<img 
									src={roomImage} 
									alt={roomLabel}
									onError={(e) => {
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
							<div className="detail-item">
								<span className="detail-label">Pod ID:</span>
								<span className="detail-value">{room.podId}</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Type:</span>
								<span className="detail-value">
									{roomLabel}
								</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Description:</span>
								<span className="detail-value">
									{roomDescription}
								</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Floor:</span>
								<span className="detail-value">
									{room.floor.charAt(0).toUpperCase() + room.floor.slice(1)}
								</span>
							</div>
							<div className="booking-confirmation__section">
								<h2>Booking Details</h2>
								<div className="detail-item">
									<span className="detail-label">Check-in:</span>
									<span className="detail-value">
										{checkInDate.toLocaleDateString("en-US", {
											weekday: "long",
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Check-out:</span>
									<span className="detail-value">
										{checkOutDate.toLocaleDateString("en-US", {
											weekday: "long",
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Number of Nights:</span>
									<span className="detail-value">{nights}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Number of Guests:</span>
									<span className="detail-value">{guests}</span>
								</div>
							</div>

							{/* Price Breakdown */}
							<div className="booking-confirmation__section">
								<h2>Price Breakdown</h2>
								<div className="detail-item">
									<span className="detail-label">Price per Night:</span>
									<span className="detail-value">
										${room.pricePerNight.toFixed(2)}
									</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Number of Nights:</span>
									<span className="detail-value">{nights}</span>
								</div>
								<div className="detail-item detail-item--total">
									<span className="detail-label">Total Price:</span>
									<span className="detail-value">${totalPrice.toFixed(2)}</span>
								</div>
							</div>
						</div>
					)}

					<div className="booking-confirmation__actions">
						<button
							onClick={handleCancel}
							className="booking-confirmation__button booking-confirmation__button--cancel"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							onClick={handleProceedToPayment}
							className="booking-confirmation__button booking-confirmation__button--primary"
							disabled={
								isLoading ||
								!!error ||
								!guestName ||
								!guestEmail ||
								!checkInTime ||
								!checkOutTime
							}
						>
							{isLoading ? "Creating Reservation..." : "Proceed to Payment"}
						</button>
					</div>
					{(!guestName || !guestEmail || !checkInTime || !checkOutTime) && (
						<p
							className="booking-confirmation__info"
							style={{
								textAlign: "center",
								marginTop: "1rem",
								color: "#666",
							}}
						>
							Please fill in all required fields to proceed.
						</p>
					)}
				</div>
			</div>
		</>
	);
};

export default BookingConfirmation;
