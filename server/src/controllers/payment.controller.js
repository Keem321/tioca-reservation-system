import PaymentService from "../services/payment.service.js";

/**
 * Create a payment intent for a reservation
 * @route POST /api/payments/create-intent
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function createPaymentIntent(req, res) {
	try {
		const { reservationId, amount, currency } = req.body;

		if (!reservationId || !amount) {
			return res.status(400).json({
				error: "reservationId and amount are required",
			});
		}

		// Validate amount is a positive number
		if (typeof amount !== "number" || amount <= 0) {
			return res.status(400).json({
				error: "Amount must be a positive number",
			});
		}

		const result = await PaymentService.createPaymentIntent(
			reservationId,
			amount,
			currency
		);

		res.json(result);
	} catch (err) {
		console.error("Error creating payment intent:", err);
		res.status(400).json({ error: err.message });
	}
}

/**
 * Confirm payment after Stripe processing
 * @route POST /api/payments/confirm
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function confirmPayment(req, res) {
	try {
		const { reservationId, paymentIntentId } = req.body;

		if (!reservationId || !paymentIntentId) {
			return res.status(400).json({
				error: "reservationId and paymentIntentId are required",
			});
		}

		const result = await PaymentService.confirmPayment(
			reservationId,
			paymentIntentId
		);

		res.json(result);
	} catch (err) {
		console.error("Error confirming payment:", err);
		res.status(400).json({ error: err.message });
	}
}

/**
 * Process refund for a reservation
 * @route POST /api/payments/refund
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function processRefund(req, res) {
	try {
		const { reservationId, amount } = req.body;

		if (!reservationId) {
			return res.status(400).json({
				error: "reservationId is required",
			});
		}

		// Convert amount to cents if provided
		const amountInCents = amount ? Math.round(amount * 100) : null;

		const result = await PaymentService.processRefund(
			reservationId,
			amountInCents
		);

		res.json(result);
	} catch (err) {
		console.error("Error processing refund:", err);
		res.status(400).json({ error: err.message });
	}
}

