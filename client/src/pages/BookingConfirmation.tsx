import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useCreateReservationMutation } from "../features/reservationsApi";
import { setPendingReservation, resetBooking } from "../features/bookingSlice";
import type { RootState } from "../store";
import type { ReservationFormData } from "../types/reservation";
import Navbar from "../components/landing/Navbar";
import "./BookingConfirmation.css";

/**
 * BookingConfirmation Component
 *
 * Displays booking confirmation details and allows user to proceed to payment.
 * Creates the reservation if not already created, then navigates to payment page.
 */
const BookingConfirmation: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const { checkIn, checkOut, guests, selectedRoom } = useSelector(
		(state: RootState) => state.booking
	);
	const { user } = useSelector((state: RootState) => state.auth);

	// Get room from location state or Redux
	const room = location.state?.room || selectedRoom;

	const [createReservation, { isLoading, error }] =
		useCreateReservationMutation();

	// Redirect if no room selected or missing booking data
	useEffect(() => {
		if (!room || !checkIn || !checkOut || !user) {
			navigate("/booking");
		}
	}, [room, checkIn, checkOut, user, navigate]);

	// Create reservation when component mounts
	useEffect(() => {
		const createBooking = async () => {
			if (!room || !checkIn || !checkOut || !user) {
				return;
			}

			// Calculate total price
			const checkInDate = new Date(checkIn);
			const checkOutDate = new Date(checkOut);
			const nights = Math.ceil(
				(checkOutDate.getTime() - checkInDate.getTime()) /
					(1000 * 60 * 60 * 24)
			);
			const totalPrice = room.pricePerNight * nights;

			const reservationData: ReservationFormData = {
				roomId: room._id,
				userId: user.id,
				guestName: user.name || user.email,
				guestEmail: user.email,
				checkInDate: checkIn,
				checkOutDate: checkOut,
				numberOfGuests: guests,
				totalPrice,
				status: "pending",
				paymentStatus: "unpaid",
			};

			try {
				const reservation = await createReservation(reservationData).unwrap();
				dispatch(setPendingReservation(reservation));
			} catch (err) {
				console.error("Failed to create reservation:", err);
			}
		};

		createBooking();
	}, [room, checkIn, checkOut, guests, user, createReservation, dispatch]);

	const handleProceedToPayment = () => {
		// Navigation will happen via the pendingReservation in Redux
		navigate("/payment");
	};

	const handleCancel = () => {
		dispatch(resetBooking());
		navigate("/booking");
	};

	if (!room || !checkIn || !checkOut) {
		return null;
	}

	// Calculate booking details
	const checkInDate = new Date(checkIn);
	const checkOutDate = new Date(checkOut);
	const nights = Math.ceil(
		(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
	);
	const totalPrice = room.pricePerNight * nights;

	const getQualityLabel = (quality: string) => {
		const labels: Record<string, string> = {
			classic: "Classic Pearl",
			milk: "Milk Pearl",
			golden: "Golden Pearl",
			crystal: "Crystal Boba Suite",
			matcha: "Matcha Pearl",
		};
		return labels[quality] || quality;
	};

	return (
		<>
			<Navbar />
			<div className="booking-confirmation">
				<div className="booking-confirmation__container">
					<div className="booking-confirmation__header">
						<h1>Confirm Your Booking</h1>
						<p className="booking-confirmation__subtitle">
							Please review your reservation details before proceeding to payment
						</p>
					</div>

					{error && (
						<div className="booking-confirmation__error">
							{(error as { data?: { error?: string } })?.data?.error ||
								"Failed to create reservation. Please try again."}
						</div>
					)}

					<div className="booking-confirmation__content">
						{/* Room Details */}
						<div className="booking-confirmation__section">
							<h2>Room Details</h2>
							<div className="detail-item">
								<span className="detail-label">Pod ID:</span>
								<span className="detail-value">{room.podId}</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Quality:</span>
								<span className="detail-value">
									{getQualityLabel(room.quality)}
								</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Floor:</span>
								<span className="detail-value">
									{room.floor.charAt(0).toUpperCase() + room.floor.slice(1)}
								</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Capacity:</span>
								<span className="detail-value">
									{room.capacity} guest{room.capacity !== 1 ? "s" : ""}
								</span>
							</div>
							{room.description && (
								<div className="detail-item">
									<span className="detail-label">Description:</span>
									<span className="detail-value">{room.description}</span>
								</div>
							)}
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
							disabled={isLoading || !!error}
						>
							{isLoading ? "Creating Reservation..." : "Proceed to Payment"}
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default BookingConfirmation;

