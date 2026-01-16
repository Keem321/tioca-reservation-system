import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
	Calendar,
	Users,
	MapPin,
	Mail,
	Phone,
	CreditCard,
	X,
	Edit,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import type { Reservation } from "../types/reservation";
import { formatMoney } from "../utils/money";
import "./GuestReservationView.css";

/**
 * GuestReservationView Component
 *
 * Displays reservation details for guests without accounts
 * Similar to the authenticated user's reservation view
 */
const GuestReservationView: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [reservation, setReservation] = useState<Reservation | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// Get reservation from location state
		const res = location.state?.reservation as Reservation | undefined;

		if (!res) {
			// Redirect to lookup if no reservation data
			navigate("/reservations/lookup", { replace: true });
		} else {
			setReservation(res);
		}
	}, [location.state, navigate]);

	/**
	 * Handle cancellation
	 */
	const handleCancelReservation = async () => {
		if (!reservation) return;

		if (
			!window.confirm(
				"Are you sure you want to cancel this reservation? This action cannot be undone."
			)
		) {
			return;
		}

		const reason = window.prompt(
			"Please provide a reason for cancellation (optional):"
		);

		setLoading(true);

		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URL || ""}/api/reservations/guest/${
					reservation._id
				}/cancel`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: reason || "",
						email: reservation.guestEmail, // For security verification
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to cancel reservation");
			}

			alert("Reservation cancelled successfully!");

			// Update local state
			setReservation({
				...reservation,
				status: "cancelled",
				cancellationReason: reason || undefined,
			});
		} catch (err) {
			alert(
				`Error: ${
					err instanceof Error ? err.message : "Failed to cancel reservation"
				}`
			);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Handle modification (redirect to support for now)
	 */
	const handleModifyReservation = () => {
		const subject = encodeURIComponent(
			`Modify Reservation ${reservation?.confirmationCode}`
		);
		const body = encodeURIComponent(
			`I would like to modify my reservation:\n\nConfirmation Code: ${reservation?.confirmationCode}\nGuest Name: ${reservation?.guestName}\n\nRequested Changes:\n[Please describe what you'd like to change]`
		);
		window.location.href = `mailto:support@tioca.com?subject=${subject}&body=${body}`;
	};

	if (!reservation) {
		return null;
	}

	// Calculate nights
	const checkIn = new Date(reservation.checkInDate);
	const checkOut = new Date(reservation.checkOutDate);
	const nights = Math.ceil(
		(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
	);

	// Format dates
	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Get room info
	const getRoomInfo = () => {
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

	// Format quality with proper casing
	const formatQuality = (quality: string) => {
		const qualityMap: Record<string, string> = {
			classic: "Classic Pearl",
			milk: "Milk Pearl",
			golden: "Golden Pearl",
			crystal: "Crystal Boba Suite",
			matcha: "Matcha Pearl",
		};
		return qualityMap[quality.toLowerCase()] || quality;
	};

	// Format floor with proper readable formatting
	const formatFloor = (floor: string) => {
		const floorMap: Record<string, string> = {
			"women-only": "Women-Only Floor",
			"men-only": "Men-Only Floor",
			couples: "Couples Floor",
			business: "Business/Quiet Floor",
		};
		return floorMap[floor.toLowerCase()] || floor;
	};

	// Status badge styling
	const getStatusBadge = (status: string) => {
		const statusMap: Record<string, { label: string; className: string }> = {
			pending: { label: "Pending", className: "status-pending" },
			confirmed: { label: "Confirmed", className: "status-confirmed" },
			"checked-in": { label: "Checked In", className: "status-checkedin" },
			"checked-out": { label: "Checked Out", className: "status-checkedout" },
			cancelled: { label: "Cancelled", className: "status-cancelled" },
		};

		const statusInfo = statusMap[status] || { label: status, className: "" };
		return (
			<span className={`status-badge ${statusInfo.className}`}>
				{statusInfo.label}
			</span>
		);
	};

	return (
		<>
			<Navbar />
			<div className="guest-reservation-view">
				<div className="guest-reservation-view__container">
					{/* Header */}
					<div className="guest-reservation-view__header">
						<h1>Your Reservation</h1>
						<div className="confirmation-code">
							<strong>Confirmation Code:</strong> {reservation.confirmationCode}
						</div>
						{getStatusBadge(reservation.status)}
					</div>

					{/* Reservation Details */}
					<div className="reservation-details">
						{/* Stay Information */}
						<div className="detail-section">
							<h2>
								<Calendar size={24} />
								Stay Information
							</h2>
							<div className="detail-grid">
								<div className="detail-item">
									<span className="detail-label">Check-in:</span>
									<span className="detail-value">{formatDate(checkIn)}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Check-out:</span>
									<span className="detail-value">{formatDate(checkOut)}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Number of Nights:</span>
									<span className="detail-value">{nights}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Guests:</span>
									<span className="detail-value">
										<Users size={16} /> {reservation.numberOfGuests}
									</span>
								</div>
							</div>
						</div>

						{/* Pod Details */}
						{roomInfo && (
							<div className="detail-section">
								<h2>
									<MapPin size={24} />
									Pod Details
								</h2>
								<div className="detail-grid">
									<div className="detail-item">
										<span className="detail-label">Pod ID:</span>
										<span className="detail-value">{roomInfo.podId}</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Quality:</span>
										<span className="detail-value">
											{formatQuality(roomInfo.quality)}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Floor:</span>
										<span className="detail-value">{formatFloor(roomInfo.floor)}</span>
									</div>
								</div>
							</div>
						)}

						{/* Guest Information */}
						<div className="detail-section">
							<h2>
								<Mail size={24} />
								Guest Information
							</h2>
							<div className="detail-grid">
								<div className="detail-item">
									<span className="detail-label">Name:</span>
									<span className="detail-value">{reservation.guestName}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Email:</span>
									<span className="detail-value">{reservation.guestEmail}</span>
								</div>
								{reservation.guestPhone && (
									<div className="detail-item">
										<span className="detail-label">Phone:</span>
										<span className="detail-value">
											<Phone size={16} /> {reservation.guestPhone}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Payment Summary */}
						<div className="detail-section">
							<h2>
								<CreditCard size={24} />
								Payment Summary
							</h2>
							<div className="payment-breakdown">
								{/* Base Room Cost */}
								<div className="payment-row">
									<span>
										{roomInfo ? formatQuality(roomInfo.quality) : "Pod"} × {nights} night
										{nights > 1 ? "s" : ""}
									</span>
									<span>{formatMoney(reservation.baseRoomPrice * nights)}</span>
								</div>

								{/* Amenities */}
								{reservation.selectedAmenities &&
									reservation.selectedAmenities.length > 0 && (
										<>
											<div className="payment-section-title">Amenities:</div>
											{reservation.selectedAmenities.map((amenity, idx) => {
												const amenityTotal =
													amenity.priceType === "per-night"
														? amenity.price * nights
														: amenity.price;
												return (
													<div key={idx} className="payment-row amenity-row">
														<span className="amenity-name">
															{amenity.name}
															<span className="amenity-details">
																{amenity.priceType === "per-night"
																	? `${nights} night${
																			nights > 1 ? "s" : ""
																	  } @ ${formatMoney(amenity.price)}/night`
																	: "Flat rate"}
															</span>
														</span>
														<span>{formatMoney(amenityTotal)}</span>
													</div>
												);
											})}
										</>
									)}

								{/* Divider */}
								<div className="payment-divider"></div>

								{/* Total */}
								<div className="payment-row total">
									<span>Total Paid</span>
									<span>{formatMoney(reservation.totalPrice)}</span>
								</div>

								{/* Payment Status */}
								<div className="payment-status">
									<span className="detail-label">Payment Status:</span>
									<span
										className={`payment-status-badge payment-${reservation.paymentStatus}`}
									>
										{reservation.paymentStatus.toUpperCase()}
									</span>
								</div>
							</div>
						</div>

						{/* Special Requests */}
						{reservation.specialRequests && (
							<div className="detail-section">
								<h2>Special Requests</h2>
								<p className="special-requests">
									{reservation.specialRequests}
								</p>
							</div>
						)}
					</div>

					{/* Important Information */}
					<div className="important-info">
						<h3>Important Information</h3>
						<ul>
							<li>
								<strong>Check-in Time:</strong> 3:00 PM onwards
							</li>
							<li>
								<strong>Check-out Time:</strong> 11:00 AM
							</li>
							<li>Contactless check-in available at our kiosk</li>
							<li>Please remove shoes before entering pod areas</li>
						</ul>

						<h3>Cancellation Policy</h3>
						<p>
							Free cancellation up to 24 hours before check-in. Cancellations
							made within 24 hours of check-in will incur a one-night charge.
						</p>
						<p className="help-text">
							To cancel or modify your reservation, please contact us at{" "}
							<a href="mailto:support@tioca.com">support@tioca.com</a> with your
							confirmation code.
						</p>
					</div>
					{reservation.status !== "cancelled" &&
						reservation.status !== "checked-out" && (
							<div className="management-actions">
								<h3>Manage This Reservation</h3>
								<div className="management-buttons">
									<button
										onClick={handleModifyReservation}
										className="btn btn-modify"
										disabled={loading}
									>
										<Edit size={18} />
										Request Modification
									</button>
									<button
										onClick={handleCancelReservation}
										className="btn btn-cancel"
										disabled={loading}
									>
										<X size={18} />
										{loading ? "Cancelling..." : "Cancel Reservation"}
									</button>
								</div>
								<p className="management-note">
									For modifications, we'll help you via email. For immediate
									cancellation, use the button above.
								</p>
							</div>
						)}

					{/* Actions */}
					<div className="action-buttons">
						<button
							onClick={() => navigate("/reservations/lookup")}
							className="btn btn-secondary"
						>
							Look Up Another Reservation
						</button>
						<button onClick={() => navigate("/")} className="btn btn-primary">
							Back to Home
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default GuestReservationView;
