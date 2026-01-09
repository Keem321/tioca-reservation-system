import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - check for .env.development first, then .env
// Check in server directory first, then root directory
const serverEnvPath = path.resolve(__dirname, "../../.env.development");
const rootEnvPath = path.resolve(__dirname, "../../../.env.development");
const serverEnv = path.resolve(__dirname, "../../.env");
const rootEnv = path.resolve(__dirname, "../../../.env");

if (fs.existsSync(serverEnvPath)) {
	dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
	dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(serverEnv)) {
	dotenv.config({ path: serverEnv });
} else if (fs.existsSync(rootEnv)) {
	dotenv.config({ path: rootEnv });
} else {
	dotenv.config();
}

import Stripe from "stripe";
import ReservationRepository from "../repositories/reservation.repository.js";
import PaymentRepository from "../repositories/payment.repository.js";
import PaymentEditRepository from "../repositories/paymentEdit.repository.js";

// Initialize Stripe with secret key from environment variables
// Check for both STRIPE_SECRET_KEY and STRIPE_SECRET (for backwards compatibility)
// Only initialize if key is provided, otherwise stripe will be null and methods will throw helpful errors
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
if (!stripeKey) {
	console.warn(
		"WARNING: STRIPE_SECRET_KEY or STRIPE_SECRET not found in environment variables. Payment functionality will not work."
	);
	console.warn(
		"Available env vars:",
		Object.keys(process.env).filter((key) => key.includes("STRIPE"))
	);
} else {
	console.log("Stripe initialized successfully");
}
const stripe = stripeKey ? new Stripe(stripeKey) : null;

class PaymentService {
	/**
	 * Create a payment intent for a reservation
	 * @param {string} reservationId - Reservation ID
	 * @param {number} amount - Amount in cents
	 * @param {string} currency - Currency code (default: 'usd')
	 * @returns {Promise<Object>} Payment intent with client secret
	 */
	async createPaymentIntent(reservationId, amount, currency = "usd") {
		if (!stripe) {
			throw new Error(
				"Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable."
			);
		}

		// Get reservation
		const reservation = await ReservationRepository.findById(reservationId);
		if (!reservation) {
			throw new Error("Reservation not found");
		}

		// Check if payment is already completed
		if (reservation.paymentStatus === "paid") {
			throw new Error("Reservation is already paid");
		}

		// Validate amount matches reservation total
		const expectedAmount = Math.round(reservation.totalPrice * 100);
		if (amount !== expectedAmount) {
			throw new Error(
				`Amount mismatch. Expected ${expectedAmount} cents, got ${amount}`
			);
		}

		// Create or retrieve customer
		let customerId = reservation.stripeCustomerId;
		if (!customerId) {
			const customer = await stripe.customers.create({
				email: reservation.guestEmail,
				name: reservation.guestName,
				metadata: {
					reservationId: reservationId.toString(),
				},
			});
			customerId = customer.id;

			// Save customer ID to reservation
			await ReservationRepository.update(reservationId, {
				stripeCustomerId: customerId,
			});
		}

		// Create payment intent
		const paymentIntent = await stripe.paymentIntents.create({
			amount,
			currency,
			customer: customerId,
			metadata: {
				reservationId: reservationId.toString(),
			},
			description: `Reservation payment for ${reservation.guestName}`,
		});

		// Save payment intent ID to reservation
		await ReservationRepository.update(reservationId, {
			stripePaymentIntentId: paymentIntent.id,
		});

		// Create Payment record in database
		const payment = await PaymentRepository.create({
			reservationId,
			userId: reservation.userId || undefined,
			amount,
			currency,
			status: "pending",
			stripePaymentIntentId: paymentIntent.id,
			stripeCustomerId: customerId,
			description: `Reservation payment for ${reservation.guestName}`,
		});

		return {
			clientSecret: paymentIntent.client_secret,
			paymentIntentId: paymentIntent.id,
			paymentRecordId: payment._id,
		};
	}

	/**
	 * Confirm payment after Stripe processing
	 * @param {string} reservationId - Reservation ID
	 * @param {string} paymentIntentId - Stripe payment intent ID
	 * @returns {Promise<Object>} Updated reservation
	 */
	async confirmPayment(reservationId, paymentIntentId) {
		if (!stripe) {
			throw new Error(
				"Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable."
			);
		}

		// Get reservation
		const reservation = await ReservationRepository.findById(reservationId);
		if (!reservation) {
			throw new Error("Reservation not found");
		}

		// Verify payment intent ID matches
		if (reservation.stripePaymentIntentId !== paymentIntentId) {
			throw new Error("Payment intent ID mismatch");
		}

		try {
			// Retrieve payment intent from Stripe
			const paymentIntent = await stripe.paymentIntents.retrieve(
				paymentIntentId
			);

			if (paymentIntent.status !== "succeeded") {
				// Payment failed - update Payment record
				const failureReason =
					paymentIntent.last_payment_error?.message || "Payment declined";
				const failureCode = paymentIntent.last_payment_error?.code || null;

				await PaymentRepository.updateByReservationId(reservationId, {
					status: "failed",
					failureReason,
					failureCode,
				});

				await ReservationRepository.update(reservationId, {
					paymentStatus: "failed",
				});

				throw new Error(
					`Payment not completed. Status: ${paymentIntent.status}. ${failureReason}`
				);
			}

			// Get charge ID from payment intent
			const chargeId =
				paymentIntent.latest_charge || paymentIntent.charges?.data?.[0]?.id;

			// Update Payment record with successful payment
			const payment = await PaymentRepository.updateByReservationId(
				reservationId,
				{
					status: "succeeded",
					stripeChargeId: chargeId,
					receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url,
				}
			);

			// Update reservation with payment status
			const updatedReservation = await ReservationRepository.update(
				reservationId,
				{
					paymentStatus: "paid",
					status: "confirmed",
					stripeChargeId: chargeId,
				}
			);

			return {
				success: true,
				reservation: updatedReservation,
				payment,
				chargeId,
			};
		} catch (error) {
			// Catch any unexpected errors and mark payment as failed
			if (!error.message.includes("Payment not completed")) {
				await PaymentRepository.updateByReservationId(reservationId, {
					status: "failed",
					failureReason: error.message || "Unknown error",
					failureCode: "processing_error",
				});

				await ReservationRepository.update(reservationId, {
					paymentStatus: "failed",
				});
			}
			throw error;
		}
	}

	/**
	 * Process refund for a reservation
	 * @param {string} reservationId - Reservation ID
	 * @param {number} amount - Refund amount in cents (optional, full refund if not provided)
	 * @returns {Promise<Object>} Refund details
	 */
	async processRefund(reservationId, amount = null) {
		if (!stripe) {
			throw new Error(
				"Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable."
			);
		}

		// Get reservation
		const reservation = await ReservationRepository.findById(reservationId);
		if (!reservation) {
			throw new Error("Reservation not found");
		}

		if (!reservation.stripeChargeId) {
			throw new Error("No charge ID found for this reservation");
		}

		// Get existing payment record
		const payment = await PaymentRepository.findByReservationId(reservationId);
		if (!payment) {
			throw new Error("No payment record found for this reservation");
		}

		// Create refund
		const refundData = {
			charge: reservation.stripeChargeId,
		};

		if (amount) {
			refundData.amount = amount;
		}

		const refund = await stripe.refunds.create(refundData);

		// Update Payment record with refund info
		const refundAmount = refund.amount;
		const paymentStatus =
			amount && amount < payment.amount ? "partial" : "refunded";

		await PaymentRepository.update(payment._id, {
			status: paymentStatus,
			refundAmount,
			refundStripeId: refund.id,
		});

		// Update reservation payment status
		await ReservationRepository.update(reservationId, {
			paymentStatus,
		});

		return {
			success: true,
			refundId: refund.id,
			amount: refundAmount / 100,
			paymentStatus,
		};
	}

	/**
	 * Update payment and track edit history
	 * @param {string} paymentId - Payment ID
	 * @param {Object} updates - Fields to update (description, metadata)
	 * @param {Object} editor - User object who made the edit
	 * @returns {Promise<Object>} Updated payment
	 */
	async updatePayment(paymentId, updates, editor) {
		// Get current payment
		const payment = await PaymentRepository.findById(paymentId);
		if (!payment) {
			throw new Error("Payment not found");
		}

		// Only allow editing of non-Stripe fields
		const allowedFields = ["description", "metadata"];
		const fieldsToUpdate = {};

		for (const field of allowedFields) {
			if (field in updates && updates[field] !== undefined) {
				fieldsToUpdate[field] = updates[field];

				// Track edit history
				await PaymentEditRepository.create({
					paymentId,
					editedBy: editor._id,
					editedByName: editor.name,
					editedByEmail: editor.email,
					fieldName: field,
					beforeValue: payment[field] || null,
					afterValue: updates[field],
					reason: updates.reason || null,
				});
			}
		}

		// Update payment
		const updated = await PaymentRepository.update(paymentId, fieldsToUpdate);
		return updated;
	}

	/**
	 * Get edit history for a payment
	 * @param {string} paymentId - Payment ID
	 * @returns {Promise<Array>} Edit history records
	 */
	async getPaymentHistory(paymentId) {
		return await PaymentEditRepository.findByPaymentId(paymentId);
	}
}

export default new PaymentService();
