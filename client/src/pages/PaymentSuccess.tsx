import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { CheckCircle, Calendar, Users, CreditCard, MapPin } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import type { Reservation } from "../types/reservation";
import type { RootState } from "../store";
import { useFormatMoney } from "../hooks/useFormatMoney";
import "./PaymentSuccess.css";

/**
 * PaymentSuccess Component
 *
 * Displays comprehensive booking confirmation after successful payment.
 */
const PaymentSuccess: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { formatMoney } = useFormatMoney();
	const { pendingReservation } = useSelector(
		(state: RootState) => state.booking
	);
	const user = useSelector((state: RootState) => state.auth.user);
	const hasChecked = useSelector((state: RootState) => state.auth.hasChecked);

	// Track if this is the initial mount (to detect page refresh)
	const isInitialMount = useRef(true);

	// Get reservation from location state (preferred) or Redux store (fallback)
	const reservation = (location.state?.reservation || pendingReservation) as
		| Reservation
		| undefined;

	// Redirect ONLY on initial page load (refresh), not when session expires while viewing
	useEffect(() => {
		// Wait for auth check to complete before deciding where to redirect
		if (!hasChecked) {
			console.log("[PaymentSuccess] Waiting for auth check to complete...");
			return;
		}

		// Only check redirect logic on initial mount (page refresh/load)
		if (!isInitialMount.current) {
			console.log(
				"[PaymentSuccess] Not initial mount - skipping redirect check"
			);
			return;
		}

		// Mark that we've done the initial check
		isInitialMount.current = false;

		// Check if we have valid reservation data (works for both logged in and guest users)
		const hasReservation = !!(
			location.state?.reservation || pendingReservation
		);

		if (!hasReservation) {
			// No reservation data - redirect based on auth status
			if (!user) {
				// Guest user with no reservation data - redirect to landing
				console.log(
					"[PaymentSuccess] No reservation data and not logged in - redirecting to landing page"
				);
				navigate("/", { replace: true });
			} else {
				// Logged in user with no reservation data - redirect to booking
				console.log(
					"[PaymentSuccess] No reservation data but logged in - redirecting to booking"
				);
				navigate("/booking", { replace: true });
			}
		} else {
			// Has reservation data - allow viewing (for both logged in and guest users)
			console.log(
				"[PaymentSuccess] Reservation data found, staying on page (user:",
				user ? "logged in" : "guest",
				")"
			);
		}
	}, [
		location.state?.reservation,
		pendingReservation,
		navigate,
		user,
		hasChecked,
	]);

	// Calculate number of nights
	const nights = reservation
		? Math.ceil(
				(new Date(reservation.checkOutDate).getTime() -
					new Date(reservation.checkInDate).getTime()) /
					(1000 * 60 * 60 * 24)
		  )
		: 0;

	// Get room information
	const getRoomInfo = () => {
		if (!reservation) return null;
		if (
			typeof reservation.roomId === "object" &&
			reservation.roomId &&
			reservation.roomId.podId
		) {
			return {
				podId: reservation.roomId.podId,
				quality: reservation.roomId.quality,
				floor: reservation.roomId.floor,
			};
		}
		return null;
	};

	const roomInfo = getRoomInfo();

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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Truncate email in the middle for display
	const truncateEmail = (email: string, maxLength: number = 25) => {
		if (email.length <= maxLength) return email;

		const [localPart, domain] = email.split("@");
		if (!domain) return email;

		// Always show full domain
		const domainLength = domain.length + 1; // +1 for @
		const availableForLocal = maxLength - domainLength - 3; // -3 for ...

		if (availableForLocal <= 0) {
			// If domain is too long, just truncate normally
			return email.substring(0, maxLength - 3) + "...";
		}

		const truncatedLocal = localPart.substring(0, availableForLocal);
		return `${truncatedLocal}...@${domain}`;
	};

	return (
		<>
			<Navbar />
			<div className="payment-success">
				<div className="payment-success__container">
					{/* Success Icon and Title */}
					<div className="payment-success__header">
						<div className="payment-success__icon">
							<CheckCircle size={80} />
						</div>
						<h1 className="payment-success__title">Booking Confirmed!</h1>
						<p className="payment-success__message">
							Your reservation has been confirmed and payment has been processed
							successfully. A confirmation email has been sent to{" "}
							<strong
								title={reservation?.guestEmail}
								style={{ cursor: "help" }}
							>
								{reservation?.guestEmail &&
									truncateEmail(reservation.guestEmail)}
							</strong>
							.
						</p>
					</div>

					{reservation && (
						<div className="payment-success__content">
							{/* Booking Summary */}
							<div className="payment-success__section">
								<h2 className="payment-success__section-title">
									<Calendar size={20} />
									Booking Summary
								</h2>
								<div className="payment-success__detail-item">
									<span className="detail-label">Reservation ID:</span>
									<span className="detail-value">
										{reservation._id.slice(-8).toUpperCase()}
									</span>
								</div>
								<div className="payment-success__detail-item">
									<span className="detail-label">Status:</span>
									<span className="detail-value detail-value--status">
										{reservation.status.charAt(0).toUpperCase() +
											reservation.status.slice(1)}
									</span>
								</div>
								<div className="payment-success__detail-item">
									<span className="detail-label">Payment Status:</span>
									<span className="detail-value detail-value--paid">Paid</span>
								</div>
							</div>

							{/* Room Information */}
							{roomInfo && (
								<div className="payment-success__section">
									<h2 className="payment-success__section-title">
										<MapPin size={20} />
										Room Details
									</h2>
									<div className="payment-success__detail-item">
										<span className="detail-label">Pod ID:</span>
										<span className="detail-value">Pod {roomInfo.podId}</span>
									</div>
									<div className="payment-success__detail-item">
										<span className="detail-label">Quality:</span>
										<span className="detail-value">
											{getQualityLabel(roomInfo.quality)}
										</span>
									</div>
									<div className="payment-success__detail-item">
										<span className="detail-label">Floor:</span>
										<span className="detail-value">
											{roomInfo.floor.charAt(0).toUpperCase() +
												roomInfo.floor.slice(1)}
										</span>
									</div>
								</div>
							)}

							{/* Stay Details */}
							<div className="payment-success__section">
								<h2 className="payment-success__section-title">
									<Calendar size={20} />
									Stay Details
								</h2>
								<div className="payment-success__detail-item">
									<span className="detail-label">Check-in:</span>
									<span className="detail-value">
										{formatDate(reservation.checkInDate)}
									</span>
								</div>
								<div className="payment-success__detail-item">
									<span className="detail-label">Check-out:</span>
									<span className="detail-value">
										{formatDate(reservation.checkOutDate)}
									</span>
								</div>
								<div className="payment-success__detail-item">
									<span className="detail-label">Number of Nights:</span>
									<span className="detail-value">{nights} night(s)</span>
								</div>
								<div className="payment-success__detail-item">
									<span className="detail-label">
										<Users size={16} style={{ display: "inline" }} /> Guests:
									</span>
									<span className="detail-value">
										{reservation.numberOfGuests}
									</span>
								</div>
							</div>

							{/* Payment Information */}
							<div className="payment-success__section payment-success__section--highlight">
								<h2 className="payment-success__section-title">
									<CreditCard size={20} />
									Payment Information
								</h2>
								<div className="payment-success__detail-item">
									<span className="detail-label">Total Amount Paid:</span>
									<span className="detail-value detail-value--total">
										{formatMoney(reservation.totalPrice)}
									</span>
								</div>
								<div className="payment-success__detail-item">
									<span className="detail-label">Payment Method:</span>
									<span className="detail-value">Credit/Debit Card</span>
								</div>
							</div>

							{/* Guest Information */}
							<div className="payment-success__section">
								<h2 className="payment-success__section-title">
									Guest Information
								</h2>
								<div className="payment-success__detail-item">
									<span className="detail-label">Name:</span>
									<span className="detail-value">{reservation.guestName}</span>
								</div>
								<div className="payment-success__detail-item">
									<span className="detail-label">Email:</span>
									<span
										className="detail-value detail-value--email"
										title={reservation.guestEmail}
									>
										{reservation.guestEmail}
									</span>
								</div>
								{reservation.guestPhone && (
									<div className="payment-success__detail-item">
										<span className="detail-label">Phone:</span>
										<span className="detail-value">
											{reservation.guestPhone}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Next Steps */}
					<div className="payment-success__next-steps">
						<h3>What's Next?</h3>
						<ul>
							<li>
								A confirmation email has been sent to{" "}
								<span
									title={reservation?.guestEmail}
									style={{ cursor: "help" }}
								>
									{reservation?.guestEmail &&
										truncateEmail(reservation.guestEmail)}
								</span>
							</li>
							<li>
								Your confirmation code is{" "}
								<strong>{reservation?.confirmationCode}</strong>
							</li>
							<li>Save this code to manage your reservation later</li>
							<li>
								Check-in instructions will be sent closer to your arrival date
							</li>
						</ul>
					</div>

					<div className="payment-success__actions">
						{reservation?.userId ? (
							<button
								onClick={() => navigate("/profile")}
								className="payment-success__button payment-success__button--primary"
							>
								View My Reservations
							</button>
						) : (
							<button
								onClick={() => navigate("/reservations/lookup")}
								className="payment-success__button payment-success__button--primary"
							>
								Manage Reservation
							</button>
						)}
						<button
							onClick={() => navigate("/")}
							className="payment-success__button payment-success__button--secondary"
						>
							Back to Home
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default PaymentSuccess;
