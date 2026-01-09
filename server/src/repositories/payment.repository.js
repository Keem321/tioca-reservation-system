import Payment from "../models/payment.model.js";

class PaymentRepository {
	/**
	 * Create a new payment record
	 * @param {Object} paymentData - Payment data
	 * @returns {Promise<Object>}
	 */
	async create(paymentData) {
		const payment = new Payment(paymentData);
		return await payment.save();
	}

	/**
	 * Find payment by ID
	 * @param {string} id - Payment ID
	 * @returns {Promise<Object|null>}
	 */
	async findById(id) {
		return await Payment.findById(id)
			.populate("reservationId")
			.populate("userId", "name email");
	}

	/**
	 * Find payment by reservation ID
	 * @param {string} reservationId - Reservation ID
	 * @returns {Promise<Object|null>}
	 */
	async findByReservationId(reservationId) {
		return await Payment.findOne({ reservationId }).populate(
			"userId",
			"name email"
		);
	}

	/**
	 * Find payment by Stripe Payment Intent ID
	 * @param {string} stripePaymentIntentId - Stripe Payment Intent ID
	 * @returns {Promise<Object|null>}
	 */
	async findByStripePaymentIntentId(stripePaymentIntentId) {
		return await Payment.findOne({ stripePaymentIntentId }).populate(
			"userId",
			"name email"
		);
	}

	/**
	 * Find all payments with optional filtering
	 * @param {Object} filter - Filter criteria
	 * @returns {Promise<Array>}
	 */
	async findAll(filter = {}) {
		return await Payment.find(filter)
			.populate(
				"reservationId",
				"guestName guestEmail checkInDate checkOutDate"
			)
			.populate("userId", "name email")
			.sort({ createdAt: -1 });
	}

	/**
	 * Update payment by ID
	 * @param {string} id - Payment ID
	 * @param {Object} updateData - Data to update
	 * @returns {Promise<Object|null>}
	 */
	async update(id, updateData) {
		return await Payment.findByIdAndUpdate(id, updateData, { new: true })
			.populate("reservationId")
			.populate("userId", "name email");
	}

	/**
	 * Update payment by reservation ID
	 * @param {string} reservationId - Reservation ID
	 * @param {Object} updateData - Data to update
	 * @returns {Promise<Object|null>}
	 */
	async updateByReservationId(reservationId, updateData) {
		return await Payment.findOneAndUpdate({ reservationId }, updateData, {
			new: true,
		})
			.populate("reservationId")
			.populate("userId", "name email");
	}

	/**
	 * Get payment statistics
	 * @returns {Promise<Object>}
	 */
	async getStats() {
		const stats = await Payment.aggregate([
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
					totalAmount: { $sum: "$amount" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		const result = {
			byStatus: {},
			totalRevenue: 0,
			totalCount: 0,
		};

		stats.forEach((stat) => {
			result.byStatus[stat._id] = {
				count: stat.count,
				amount: stat.totalAmount,
			};
			if (stat._id === "succeeded") {
				result.totalRevenue = stat.totalAmount;
			}
			result.totalCount += stat.count;
		});

		return result;
	}

	/**
	 * Get payments by date range
	 * @param {Date} startDate - Start date
	 * @param {Date} endDate - End date
	 * @returns {Promise<Array>}
	 */
	async findByDateRange(startDate, endDate) {
		return await Payment.find({
			createdAt: { $gte: startDate, $lte: endDate },
		})
			.populate(
				"reservationId",
				"guestName guestEmail checkInDate checkOutDate"
			)
			.populate("userId", "name email")
			.sort({ createdAt: -1 });
	}

	/**
	 * Delete payment by ID
	 * @param {string} id - Payment ID
	 * @returns {Promise<Object|null>}
	 */
	async delete(id) {
		return await Payment.findByIdAndDelete(id);
	}

	/**
	 * Run aggregation pipeline on payments
	 * @param {Array} pipeline - MongoDB aggregation pipeline
	 * @returns {Promise<Array>}
	 */
	async aggregate(pipeline) {
		return await Payment.aggregate(pipeline);
	}
}

export default new PaymentRepository();
