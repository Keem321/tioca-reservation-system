import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { useAnalyticsTracking } from "../hooks/useAnalytics";
import {
	Elements,
	CardElement,
	PaymentRequestButtonElement,
	useStripe,
	useElements,
} from "@stripe/react-stripe-js";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../hooks";
import {
	useCreatePaymentIntentMutation,
	useConfirmPaymentMutation,
} from "../features/paymentsApi";
import { resetBooking } from "../features/bookingSlice";
import type { BookingState } from "../features/bookingSlice";
import type { Reservation } from "../types/reservation";
import Navbar from "../components/landing/Navbar";
import BookingBreadcrumb from "../components/booking/BookingBreadcrumb";
import { useFormatMoney } from "../hooks/useFormatMoney";
import "./Payment.css";

// Initialize Stripe with publishable key
// Get from environment variable (must be set in client/.env or client/.env.development)
const STRIPE_PUBLISHABLE_KEY =
	import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

// Only load Stripe if we have a valid key
const stripePromise = STRIPE_PUBLISHABLE_KEY
	? loadStripe(STRIPE_PUBLISHABLE_KEY)
	: null;

/**
 * Payment Form Component
 * Handles the actual payment form with Stripe Elements
 */
import type { PaymentRequest as StripePaymentRequest } from "@stripe/stripe-js";

const PaymentForm: React.FC<{ reservation: Reservation }> = ({
	reservation,
}) => {
	const stripe = useStripe();
	const elements = useElements();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { formatMoney } = useFormatMoney();

	// Track analytics completion when payment succeeds
	const { trackComplete } = useAnalyticsTracking("payment");

	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [stripeLoadError, setStripeLoadError] = useState<string | null>(null);
	const [paymentIntentData, setPaymentIntentData] = useState<{
		clientSecret: string;
		paymentIntentId: string;
	} | null>(null);
	const [paymentRequest, setPaymentRequest] =
		useState<StripePaymentRequest | null>(null);
	const [agreeToTerms, setAgreeToTerms] = useState(false);
	const [subscribeToMarketing, setSubscribeToMarketing] = useState(false);
	const [createPaymentIntent, { isLoading: isCreatingIntent }] =
		useCreatePaymentIntentMutation();
	const [confirmPayment, { isLoading: isConfirming }] =
		useConfirmPaymentMutation();

	// Check if Stripe loaded successfully
	useEffect(() => {
		if (!stripe && stripePromise) {
			// Check if it's still loading or if there was an error
			const checkStripe = async () => {
				try {
					const stripeInstance = await stripePromise;
					if (!stripeInstance) {
						setStripeLoadError(
							"Stripe failed to initialize. This may be due to an ad blocker blocking Stripe requests. Please disable ad blockers for this site and refresh the page."
						);
					}
				} catch {
					setStripeLoadError(
						"Stripe failed to load. This may be due to an ad blocker blocking Stripe requests. Please disable ad blockers for this site and refresh the page."
					);
				}
			};
			// Give Stripe a moment to load before checking
			const timeout = setTimeout(() => {
				if (!stripe) {
					checkStripe();
				}
			}, 2000);
			return () => clearTimeout(timeout);
		}
	}, [stripe]);

	// Calculate total amount in cents (totalPrice is already in cents from backend)
	const amountInCents = Math.round(reservation.totalPrice);

	// Create payment intent when component mounts
	useEffect(() => {
		const createIntent = async () => {
			try {
				const result = await createPaymentIntent({
					reservationId: reservation._id,
					amount: amountInCents,
					currency: "usd",
				}).unwrap();
				setPaymentIntentData(result);
			} catch (err) {
				const error = err as { data?: { error?: string } };
				setError(
					error?.data?.error ||
						"Failed to initialize payment. Please try again."
				);
			}
		};

		if (reservation._id && !paymentIntentData) {
			createIntent();
		}
	}, [reservation._id, amountInCents, createPaymentIntent, paymentIntentData]);

	// Set up Payment Request Button (Google Pay / Apple Pay)
	useEffect(() => {
		if (!stripe || !paymentIntentData) {
			return;
		}

		const pr = stripe.paymentRequest({
			country: "US",
			currency: "usd",
			total: {
				label: "Hotel Reservation",
				amount: amountInCents,
			},
			requestPayerName: true,
			requestPayerEmail: true,
		});

		// Check if Payment Request is available (Google Pay / Apple Pay)
		pr.canMakePayment().then((result) => {
			if (result) {
				setPaymentRequest(pr);
			}
		});

		// Handle payment method submission
		pr.on("paymentmethod", async (ev) => {
			setIsProcessing(true);
			setError(null);

			try {
				// Confirm payment with Stripe using the payment method from Google/Apple Pay
				const { error: confirmError, paymentIntent } =
					await stripe.confirmCardPayment(
						paymentIntentData.clientSecret,
						{
							payment_method: ev.paymentMethod.id,
						},
						{ handleActions: false }
					);

				if (confirmError) {
					ev.complete("fail");
					setError(confirmError.message || "Payment failed");
					setIsProcessing(false);
					return;
				}

				ev.complete("success");

				if (paymentIntent?.status === "requires_action") {
					// Handle 3D Secure if needed
					const { error: actionError } = await stripe.confirmCardPayment(
						paymentIntentData.clientSecret
					);
					if (actionError) {
						setError(actionError.message || "Authentication failed");
						setIsProcessing(false);
						return;
					}
				}

				// Confirm payment on backend
				const confirmResult = await confirmPayment({
					reservationId: reservation._id,
					paymentIntentId: paymentIntentData.paymentIntentId,
				}).unwrap();

				if (confirmResult.success) {
					trackComplete();
					navigate("/payment/success", {
						state: { reservation: confirmResult.reservation },
						replace: true,
					});
					// Delay reset to ensure navigation completes and success page mounts
					setTimeout(() => {
						dispatch(resetBooking());
					}, 1000);
				} else {
					setError(confirmResult.message || "Payment confirmation failed");
					setIsProcessing(false);
				}
			} catch (err) {
				ev.complete("fail");
				const error = err as { data?: { error?: string }; message?: string };
				setError(
					error?.data?.error ||
						error?.message ||
						"An error occurred during payment processing"
				);
				setIsProcessing(false);
			}
		});
	}, [
		stripe,
		paymentIntentData,
		amountInCents,
		reservation._id,
		confirmPayment,
		navigate,
		dispatch,
	]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		e.stopPropagation(); // Prevent any form bubbling

		if (!agreeToTerms) {
			setError("Please agree to the terms and conditions to proceed.");
			return;
		}

		if (!stripe || !elements) {
			setError("Payment form is not ready. Please wait for Stripe to load.");
			return;
		}

		setIsProcessing(true);
		setError(null);

		const cardElement = elements.getElement(CardElement);

		if (!cardElement) {
			setError("Card element not found");
			setIsProcessing(false);
			return;
		}

		if (!paymentIntentData) {
			setError("Payment not initialized. Please refresh the page.");
			setIsProcessing(false);
			return;
		}

		try {
			// Confirm payment with Stripe
			const { error: stripeError, paymentIntent } =
				await stripe.confirmCardPayment(paymentIntentData.clientSecret, {
					payment_method: {
						card: cardElement,
					},
				});

			if (stripeError) {
				setError(stripeError.message || "Payment failed");
				setIsProcessing(false);
				return;
			}

			if (paymentIntent?.status === "succeeded") {
				// Confirm payment on backend
				const confirmResult = await confirmPayment({
					reservationId: reservation._id,
					paymentIntentId: paymentIntentData.paymentIntentId,
				}).unwrap();

				if (confirmResult.success) {
					// Navigate first, then reset booking state after navigation completes
					trackComplete();
					navigate("/payment/success", {
						state: { reservation: confirmResult.reservation },
						replace: true, // Replace current history entry to prevent back button issues
					});
					// Reset booking state after delay to ensure navigation completes and success page mounts
					setTimeout(() => {
						dispatch(resetBooking());
					}, 1000);
				} else {
					setError(confirmResult.message || "Payment confirmation failed");
					setIsProcessing(false);
				}
			} else {
				setError("Payment was not completed");
				setIsProcessing(false);
			}
		} catch (err) {
			const error = err as { data?: { error?: string }; message?: string };
			const errorMessage = error?.data?.error || error?.message || "";

			// Check if it's a network/blocked error
			if (
				errorMessage.includes("Failed to fetch") ||
				errorMessage.includes("ERR_BLOCKED_BY_CLIENT") ||
				errorMessage.includes("network") ||
				errorMessage.includes("blocked")
			) {
				setError(
					"Payment processing failed due to network issues. This is often caused by ad blockers blocking Stripe. Please disable ad blockers for this site and try again."
				);
			} else {
				setError(
					errorMessage ||
						"An error occurred during payment processing. Please try again."
				);
			}
			setIsProcessing(false);
		}
	};

	const cardElementOptions = {
		style: {
			base: {
				fontSize: "16px",
				color: "#424770",
				"::placeholder": {
					color: "#aab7c4",
				},
			},
			invalid: {
				color: "#9e2146",
			},
		},
	};

	// Show error if Stripe failed to load
	if (stripeLoadError) {
		return (
			<div className="payment-form">
				<div className="payment-form__error">
					<h3>Stripe Loading Error</h3>
					<p>{stripeLoadError}</p>
					<p>
						Common causes:
						<ul>
							<li>Ad blockers blocking Stripe.js requests</li>
							<li>Browser extensions interfering with Stripe</li>
							<li>Network connectivity issues</li>
						</ul>
					</p>
					<button
						onClick={() => window.location.reload()}
						className="payment-form__submit-button"
					>
						Refresh Page
					</button>
				</div>
			</div>
		);
	}

	// Show loading state while Stripe initializes
	if (!stripe || !elements) {
		return (
			<div className="payment-form">
				<div className="payment-form__loading">
					<p>Loading payment form...</p>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="payment-form">
			{/* Google Pay / Apple Pay Button */}
			{paymentRequest && (
				<div className="payment-form__section">
					<label className="payment-form__label">Express Checkout</label>
					<div className="payment-form__payment-request">
						<PaymentRequestButtonElement options={{ paymentRequest }} />
					</div>
				</div>
			)}

			{/* Divider if payment request is available */}
			{paymentRequest && (
				<div className="payment-form__divider">
					<span>Or pay with card</span>
				</div>
			)}

			<div className="payment-form__section">
				<label className="payment-form__label">Card Details</label>
				<div className="payment-form__card-element">
					<CardElement options={cardElementOptions} />
				</div>
			</div>

			{/* Terms and Marketing Checkboxes */}
			<div className="payment-form__section">
				<label className="payment-form__checkbox-label">
					<input
						type="checkbox"
						checked={agreeToTerms}
						onChange={(e) => setAgreeToTerms(e.target.checked)}
						className="payment-form__checkbox"
					/>
					<span className="payment-form__checkbox-text">
						I agree to the{" "}
						<a
							href="/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="payment-form__link"
						>
							Terms & Conditions
						</a>{" "}
						and{" "}
						<a
							href="/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="payment-form__link"
						>
							Privacy Policy
						</a>{" "}
						<span className="payment-form__required">*</span>
					</span>
				</label>

				<label className="payment-form__checkbox-label">
					<input
						type="checkbox"
						checked={subscribeToMarketing}
						onChange={(e) => setSubscribeToMarketing(e.target.checked)}
						className="payment-form__checkbox"
					/>
					<span className="payment-form__checkbox-text">
						I would like to receive promotional emails and special offers from
						Tapioca
					</span>
				</label>
			</div>

			{error && (
				<div className="payment-form__error">
					<h3>Payment Error</h3>
					<p>{error}</p>
					{error.includes("ad blocker") && (
						<div
							style={{
								marginTop: "1rem",
								padding: "1rem",
								background: "rgba(168, 100, 52, 0.1)",
								borderRadius: "8px",
							}}
						>
							<strong>Quick Fix:</strong>
							<ol style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
								<li>Disable your ad blocker for localhost</li>
								<li>
									Or whitelist <code>*.stripe.com</code> and{" "}
									<code>*.stripejs.com</code>
								</li>
								<li>Refresh the page and try again</li>
							</ol>
						</div>
					)}
				</div>
			)}

			<button
				type="submit"
				disabled={
					!stripe ||
					!paymentIntentData ||
					!agreeToTerms ||
					isProcessing ||
					isCreatingIntent ||
					isConfirming
				}
				className="payment-form__submit-button"
			>
				{isProcessing || isCreatingIntent || isConfirming
					? "Processing..."
					: `Pay ${formatMoney(reservation.totalPrice)}`}
			</button>
		</form>
	);
};

/**
 * Payment Page Component
 * Main payment page that wraps the payment form with Stripe Elements provider
 */
const Payment: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { pendingReservation } = useAppSelector(
		(state) => state.booking as BookingState
	);

	// Get reservation from either location state or Redux
	const reservation: Reservation | null =
		location.state?.reservation || pendingReservation || null;

	// Handle breadcrumb navigation
	const handleBreadcrumbClick = (step: number) => {
		if (step === 1) {
			// Navigate back to booking/search page
			navigate("/booking");
		} else if (step === 2) {
			// Navigate back to confirmation page
			navigate("/booking/confirm", {
				state: location.state,
			});
		}
	};

	// Note: We don't extend the hold here because:
	// - The reservation was already created on the confirmation page
	// - The hold was converted and linked to the reservation
	// - The room is already reserved (reservation status: "pending")
	// - If payment succeeds → reservation becomes "confirmed"
	// - If payment fails → reservation stays "pending" (can be cleaned up later)

	// No hold extension needed; reservation already created on confirmation

	// Redirect if no reservation
	useEffect(() => {
		if (!reservation) {
			navigate("/booking");
		}
	}, [reservation, navigate]);

	// Check if Stripe is configured
	if (!STRIPE_PUBLISHABLE_KEY) {
		return (
			<>
				<Navbar />
				<BookingBreadcrumb
					currentStep={3}
					onStepClick={handleBreadcrumbClick}
				/>
				<div className="payment-page">
					<div className="payment-page__container">
						<div className="payment-page__error">
							<h2>Stripe Not Configured</h2>
							<p>
								Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your{" "}
								<code>client/.env</code> or <code>client/.env.development</code>{" "}
								file.
							</p>
							<p>
								Example: <code>VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...</code>
							</p>
						</div>
					</div>
				</div>
			</>
		);
	}

	// Note: stripePromise is a Promise, so we can't check it directly here
	// The Elements component will handle loading errors

	// Group bookings are now handled as single reservations with roomIds array

	// Individual booking flow
	if (!reservation) {
		return null;
	}

	// Calculate number of nights
	const checkIn = new Date(reservation.checkInDate);
	const checkOut = new Date(reservation.checkOutDate);
	const nights = Math.ceil(
		(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
	);

	const elementsOptions: StripeElementsOptions = {
		mode: "payment",
		amount: Math.round(reservation.totalPrice), // totalPrice is already in cents
		currency: "usd",
	};

	return (
		<>
			<Navbar />
			<BookingBreadcrumb currentStep={3} onStepClick={handleBreadcrumbClick} />
			<div className="payment-page">
				<div className="payment-page__container">
					<div className="payment-page__header">
						<h1>Complete Your Payment</h1>
						<p className="payment-page__subtitle">
							Review your reservation details and complete payment
						</p>
					</div>

					{/* Ad Blocker Warning */}
					<div
						className="payment-page__adblock-warning"
						style={{
							background: "rgba(168, 100, 52, 0.15)",
							border: "2px solid var(--color-primary)",
							borderRadius: "12px",
							padding: "1rem 1.5rem",
							marginBottom: "2rem",
							textAlign: "center",
						}}
					>
						<strong style={{ color: "var(--color-text-primary)" }}>
							⚠️ Important: Ad blockers may prevent payment processing
						</strong>
						<p
							style={{
								marginTop: "0.5rem",
								fontSize: "0.9rem",
								color: "var(--color-text-secondary)",
							}}
						>
							If you see errors when submitting, please disable your ad blocker
							for this site or whitelist <code>*.stripe.com</code>
						</p>
					</div>

					<div className="payment-page__content">
						{/* Reservation Summary */}
						<div className="payment-page__summary">
							<h2>Reservation Summary</h2>
							<div className="summary-item">
								<span className="summary-label">
									{reservation.roomIds && reservation.roomIds.length > 1
										? "Rooms:"
										: "Room:"}
								</span>
								<span className="summary-value">
									{reservation.roomIds && reservation.roomIds.length > 0
										? reservation.roomIds
												.map((room) =>
													typeof room === "object"
														? `Pod ${room.podId} (${room.quality})`
														: "Room"
												)
												.join(", ")
										: typeof reservation.roomId === "object"
										? `Pod ${reservation.roomId.podId} - ${reservation.roomId.quality}`
										: "Room"}
								</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Check-in:</span>
								<span className="summary-value">
									{new Date(reservation.checkInDate).toLocaleDateString()}
								</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Check-out:</span>
								<span className="summary-value">
									{new Date(reservation.checkOutDate).toLocaleDateString()}
								</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Guests:</span>
								<span className="summary-value">
									{reservation.numberOfGuests}
								</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Nights:</span>
								<span className="summary-value">{nights}</span>
							</div>

							{/* Detailed Price Breakdown */}
							<div className="summary-divider"></div>

							{/* Per-room breakdown */}
							{reservation.roomIds && reservation.roomIds.length > 0 ? (
								<>
									<div className="summary-section-title">Rooms:</div>
									{reservation.roomIds.map((room, idx) => (
										<div key={idx} className="summary-item">
											<span className="summary-label">
												{typeof room === "object"
													? `Pod ${room.podId} (${room.quality})`
													: "Room"}{" "}
												× {nights} night{nights > 1 ? "s" : ""}
											</span>
											<span className="summary-value">
												{formatMoney(reservation.baseRoomPrice * nights)}
											</span>
										</div>
									))}
								</>
							) : (
								<div className="summary-item">
									<span className="summary-label">
										{typeof reservation.roomId === "object"
											? `Pod ${reservation.roomId.podId} (${reservation.roomId.quality})`
											: "Room"}{" "}
										× {nights} night{nights > 1 ? "s" : ""}
									</span>
									<span className="summary-value">
										{formatMoney(reservation.baseRoomPrice * nights)}
									</span>
								</div>
							)}

							{reservation.selectedAmenities.length > 0 && (
								<>
									<div className="summary-section-title">Amenities:</div>
									{reservation.selectedAmenities.map((amenity, idx) => {
										const amenityTotal =
											amenity.priceType === "per-night"
												? amenity.price * nights
												: amenity.price;
										return (
											<div
												key={idx}
												className="summary-item summary-amenity-item"
											>
												<span className="summary-label amenity-label">
													{amenity.name}
													<span className="amenity-details">
														{amenity.priceType === "per-night"
															? `${nights} night${
																	nights > 1 ? "s" : ""
															  } @ ${formatMoney(amenity.price)}/night`
															: "Flat rate"}
													</span>
												</span>
												<span className="summary-value">
													{formatMoney(amenityTotal)}
												</span>
											</div>
										);
									})}
								</>
							)}
							<div className="summary-divider"></div>

							<div className="summary-item summary-item--total">
								<span className="summary-label">Total:</span>
								<span className="summary-value">
									{formatMoney(reservation.totalPrice)}
								</span>
							</div>
						</div>

						{/* Payment Form */}
						<div className="payment-page__form-container">
							{stripePromise ? (
								<Elements stripe={stripePromise} options={elementsOptions}>
									<PaymentForm reservation={reservation} />
								</Elements>
							) : (
								<div className="payment-form__error">
									<h3>Stripe Not Configured</h3>
									<p>
										Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your
										environment variables.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default Payment;
