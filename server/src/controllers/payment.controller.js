import PaymentService from "../services/payment.service.js";
import PaymentRepository from "../repositories/payment.repository.js";

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

/**
 * Get all payments with optional filtering
 * @route GET /api/payments
 * @query {string} dateFrom - Filter from date (YYYY-MM-DD)
 * @query {string} dateTo - Filter to date (YYYY-MM-DD)
 * @query {string} status - Filter by payment status
 * @query {string} reservationId - Filter by reservation ID
 * @query {number} limit - Limit results (default 50)
 * @query {number} skip - Skip results (default 0)
 * @returns {void}
 */
export async function getPayments(req, res) {
	try {
		const {
			dateFrom,
			dateTo,
			status,
			reservationId,
			limit = 50,
			skip = 0,
		} = req.query;

		const filter = {};

		// Date range filter
		if (dateFrom || dateTo) {
			filter.createdAt = {};
			if (dateFrom) {
				filter.createdAt.$gte = new Date(dateFrom);
			}
			if (dateTo) {
				const endDate = new Date(dateTo);
				endDate.setHours(23, 59, 59, 999);
				filter.createdAt.$lte = endDate;
			}
		}

		// Status filter
		if (status) {
			filter.status = status;
		}

		// Reservation ID filter
		if (reservationId) {
			filter.reservationId = reservationId;
		}

		// Query payments with pagination
		const payments = await PaymentRepository.findAll(
			filter,
			parseInt(limit),
			parseInt(skip)
		);

		res.json(payments);
	} catch (err) {
		console.error("Error fetching payments:", err);
		res.status(500).json({
			error: "Failed to fetch payments",
			message: err.message,
		});
	}
}

/**
 * Get payment statistics
 * @route GET /api/payments/stats
 * @query {string} dateFrom - Filter from date (YYYY-MM-DD)
 * @query {string} dateTo - Filter to date (YYYY-MM-DD)
 * @returns {void}
 */
export async function getPaymentStats(req, res) {
	try {
		const { dateFrom, dateTo } = req.query;

		const filter = {};

		// Date range filter
		if (dateFrom || dateTo) {
			filter.createdAt = {};
			if (dateFrom) {
				filter.createdAt.$gte = new Date(dateFrom);
			}
			if (dateTo) {
				const endDate = new Date(dateTo);
				endDate.setHours(23, 59, 59, 999);
				filter.createdAt.$lte = endDate;
			}
		}

		// Get stats from repository
		const stats = await PaymentRepository.getStats(filter);

		res.json(stats);
	} catch (err) {
		console.error("Error fetching payment stats:", err);
		res.status(500).json({
			error: "Failed to fetch payment statistics",
			message: err.message,
		});
	}
}

/**
 * Get a single payment
 * @route GET /api/payments/:paymentId
 * @returns {void}
 */
export async function getPayment(req, res) {
	try {
		const { paymentId } = req.params;

		const payment = await PaymentRepository.findById(paymentId);

		if (!payment) {
			return res.status(404).json({
				error: "Payment not found",
			});
		}

		res.json(payment);
	} catch (err) {
		console.error("Error fetching payment:", err);
		res.status(500).json({
			error: "Failed to fetch payment",
			message: err.message,
		});
	}
}

/**
 * Get payment by reservation ID
 * @route GET /api/payments/reservation/:reservationId
 * @returns {void}
 */
export async function getPaymentByReservation(req, res) {
	try {
		const { reservationId } = req.params;

		const payment = await PaymentRepository.findByReservationId(reservationId);

		if (!payment) {
			return res.status(404).json({
				error: "Payment not found for this reservation",
			});
		}

		res.json(payment);
	} catch (err) {
		console.error("Error fetching reservation payment:", err);
		res.status(500).json({
			error: "Failed to fetch reservation payment",
			message: err.message,
		});
	}
}

/**
 * Get monthly revenue report
 * @route GET /api/payments/reports/revenue
 * @returns {void}
 */
export async function getRevenueReport(req, res) {
	try {
		const pipeline = [
			{
				$match: {
					status: "succeeded",
				},
			},
			{
				$group: {
					_id: {
						year: { $year: "$createdAt" },
						month: { $month: "$createdAt" },
					},
					totalRevenue: { $sum: "$amount" },
					count: { $sum: 1 },
					avgAmount: { $avg: "$amount" },
				},
			},
			{
				$sort: {
					"_id.year": -1,
					"_id.month": -1,
				},
			},
		];

		const revenue = await PaymentRepository.aggregate(pipeline);

		res.json(revenue);
	} catch (err) {
		console.error("Error fetching revenue report:", err);
		res.status(500).json({
			error: "Failed to fetch revenue report",
			message: err.message,
		});
	}
}

/**
 * Update payment details and track edit history
 * @route PATCH /api/payments/:paymentId
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function updatePayment(req, res) {
	try {
		const { paymentId } = req.params;
		const { description, metadata, reason } = req.body;

		if (!description && !metadata) {
			return res.status(400).json({
				error: "At least one field to update is required",
			});
		}

		const result = await PaymentService.updatePayment(
			paymentId,
			{ description, metadata, reason },
			req.user
		);

		res.json({
			success: true,
			payment: result,
		});
	} catch (err) {
		console.error("Error updating payment:", err);
		res.status(500).json({
			error: "Failed to update payment",
			message: err.message,
		});
	}
}

/**
 * Get payment edit history
 * @route GET /api/payments/:paymentId/history
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getPaymentHistory(req, res) {
	try {
		const { paymentId } = req.params;

		const history = await PaymentService.getPaymentHistory(paymentId);

		res.json(history);
	} catch (err) {
		console.error("Error fetching payment history:", err);
		res.status(500).json({
			error: "Failed to fetch payment history",
			message: err.message,
		});
	}
}
