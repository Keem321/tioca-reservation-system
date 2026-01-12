import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
	useCreateReservationMutation,
	useGetAvailableSlotsQuery,
} from "../features/reservationsApi";
import {
	useCreateHoldMutation,
	useReleaseHoldMutation,
} from "../features/holdsApi";
import { setPendingReservation, resetBooking, setHoldId } from "../features/bookingSlice";
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
	const { checkIn, checkOut, guests, selectedRoom, holdId } = useSelector(
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

	// Hold state
	const [holdError, setHoldError] = useState("");
	const [isCreatingHold, setIsCreatingHold] = useState(false);

	// Get room from location state or Redux
	const room = location.state?.room || selectedRoom;

	// Hold mutations
	const [createHold] = useCreateHoldMutation();
	const [releaseHold] = useReleaseHoldMutation();

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

	// Create hold on mount and release on unmount
	useEffect(() => {
		let mounted = true;
		let createdHoldId: string | null = null;

		const createRoomHold = async () => {
			// Don't create if we already have a hold or component unmounted
			if (!room || !checkIn || !checkOut || holdId || !mounted) {
				return;
			}

			setIsCreatingHold(true);
			setHoldError("");

			try {
				const hold = await createHold({
					roomId: room._id,
					checkInDate: checkIn,
					checkOutDate: checkOut,
					stage: "confirmation",
				}).unwrap();

				if (mounted) {
					dispatch(setHoldId(hold._id));
					createdHoldId = hold._id;
				}
			} catch (err: any) {
				if (mounted) {
					const errorMessage =
						err?.data?.error || "Failed to reserve this room. It may no longer be available.";
					setHoldError(errorMessage);
				}
			} finally {
				if (mounted) {
					setIsCreatingHold(false);
				}
			}
		};

		createRoomHold();

		// Cleanup: release hold when component unmounts
		return () => {
			mounted = false;
			const holdToRelease = createdHoldId || holdId;
			if (holdToRelease) {
				releaseHold(holdToRelease).catch((err) => {
					console.error("Failed to release hold:", err);
				});
				dispatch(setHoldId(null));
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Run only on mount

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
			holdId: holdId || undefined, // Include hold ID for verification
		};

		try {
			const reservation = await createReservation(reservationData).unwrap();
			dispatch(setPendingReservation(reservation));
			// Don't release hold here - it will be released after payment or on unmount of payment page
			navigate("/payment");
		} catch (err: any) {
			console.error("Failed to create reservation:", err);
			// Show user-friendly error message
			const errorMessage = err?.data?.error || err?.message || "Failed to create reservation. Please try again.";
			setTimeError(errorMessage);
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

				{/* Hold status messages */}
				{isCreatingHold && (
					<div className="booking-confirmation__notice" style={{ 
						background: "rgba(168, 100, 52, 0.1)", 
						padding: "1rem", 
						borderRadius: "8px",
						marginBottom: "1rem"
					}}>
						<p style={{ margin: 0, textAlign: "center" }}>
							🔒 Reserving this room for you...
						</p>
					</div>
				)}

				{holdError && (
					<div className="booking-confirmation__error" style={{ 
						background: "rgba(220, 53, 69, 0.1)", 
						border: "2px solid #dc3545",
						padding: "1rem", 
						borderRadius: "8px",
						marginBottom: "1rem"
					}}>
						<h3 style={{ marginTop: 0 }}>⚠️ Room Unavailable</h3>
						<p style={{ marginBottom: 0 }}>{holdError}</p>
						<button
							onClick={() => navigate("/booking")}
							style={{
								marginTop: "1rem",
								padding: "0.5rem 1rem",
								background: "var(--color-primary)",
								color: "white",
								border: "none",
								borderRadius: "8px",
								cursor: "pointer"
							}}
						>
							Search for Other Rooms
						</button>
					</div>
				)}

				{holdId && !isCreatingHold && !holdError && (
					<div className="booking-confirmation__notice" style={{ 
						background: "rgba(40, 167, 69, 0.1)", 
						border: "2px solid #28a745",
						padding: "1rem", 
						borderRadius: "8px",
						marginBottom: "1rem",
						textAlign: "center"
					}}>
						<p style={{ margin: 0 }}>
							✅ <strong>Room Reserved!</strong> This room is held for you for the next 5 minutes.
						</p>
					</div>
				)}

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
											e.currentTarget.style.display = "none";
										}}
									/>
								</div>
								<div className="detail-item">
									<span className="detail-label">Pod ID:</span>
									<span className="detail-value">{room.podId}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Type:</span>
									<span className="detail-value">{roomLabel}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Description:</span>
									<span className="detail-value">{roomDescription}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Floor:</span>
									<span className="detail-value">
										{room.floor.charAt(0).toUpperCase() + room.floor.slice(1)}
									</span>
								</div>
							</div>

							{/* Booking Details */}
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
							!checkOutTime ||
							isCreatingHold ||
							!!holdError ||
							!holdId
						}
					>
						{isLoading ? "Creating Reservation..." : isCreatingHold ? "Reserving Room..." : "Proceed to Payment"}
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
