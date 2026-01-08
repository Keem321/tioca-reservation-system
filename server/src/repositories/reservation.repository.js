import Reservation from "../models/reservation.model.js";

class ReservationRepository {
	/**
	 * Get all reservations with optional filtering
	 * @param {Object} filter - Filter criteria
	 * @returns {Promise<Array>}
	 */
	async findAll(filter = {}) {
		return await Reservation.find(filter)
			.populate("roomId", "podId quality floor pricePerNight")
			.populate("userId", "name email")
			.sort({ createdAt: -1 });
	}

	/**
	 * Get reservations by room ID
	 * @param {string} roomId - Room ID
	 * @returns {Promise<Array>}
	 */
	async findByRoomId(roomId) {
		return await Reservation.find({ roomId })
			.populate("userId", "name email")
			.sort({ checkInDate: 1 });
	}

	/**
	 * Get reservations by user ID
	 * @param {string} userId - User ID
	 * @returns {Promise<Array>}
	 */
	async findByUserId(userId) {
		return await Reservation.find({ userId })
			.populate("roomId", "podId quality floor")
			.sort({ checkInDate: -1 });
	}

	/**
	 * Find a reservation by ID
	 * @param {string} id - Reservation ID
	 * @returns {Promise<Object|null>}
	 */
	async findById(id) {
		return await Reservation.findById(id)
			.populate("roomId", "podId quality floor pricePerNight amenities")
			.populate("userId", "name email");
	}

	/**
	 * Create a new reservation
	 * @param {Object} reservationData - Reservation data
	 * @returns {Promise<Object>}
	 */
	async create(reservationData) {
		const reservation = new Reservation(reservationData);
		return await reservation.save();
	}

	/**
	 * Update a reservation by ID
	 * @param {string} id - Reservation ID
	 * @param {Object} updateData - Data to update
	 * @returns {Promise<Object|null>}
	 */
	async update(id, updateData) {
		return await Reservation.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		})
			.populate("roomId", "podId quality floor pricePerNight")
			.populate("userId", "name email");
	}

	/**
	 * Delete a reservation by ID
	 * @param {string} id - Reservation ID
	 * @returns {Promise<Object|null>}
	 */
	async delete(id) {
		return await Reservation.findByIdAndDelete(id);
	}

	/**
	 * Check for overlapping reservations
	 * @param {string} roomId - Room ID
	 * @param {Date} checkIn - Check-in date
	 * @param {Date} checkOut - Check-out date
	 * @param {string} excludeReservationId - Reservation ID to exclude (for updates)
	 * @returns {Promise<Array>}
	 */
	async findOverlapping(
		roomId,
		checkIn,
		checkOut,
		excludeReservationId = null
	) {
		const query = {
			roomId,
			status: { $nin: ["cancelled"] },
			$or: [
				{ checkInDate: { $lt: checkOut, $gte: checkIn } },
				{ checkOutDate: { $gt: checkIn, $lte: checkOut } },
				{ checkInDate: { $lte: checkIn }, checkOutDate: { $gte: checkOut } },
			],
		};

		if (excludeReservationId) {
			query._id = { $ne: excludeReservationId };
		}

		return await Reservation.find(query);
	}

	/**
	 * Update reservation status
	 * @param {string} id - Reservation ID
	 * @param {string} status - New status
	 * @returns {Promise<Object|null>}
	 */
	async updateStatus(id, status) {
		const updateData = { status };

		if (status === "cancelled") {
			updateData.cancelledAt = new Date();
		}

		return await Reservation.findByIdAndUpdate(id, updateData, { new: true });
	}

	/**
	 * Get upcoming check-ins
	 * @param {number} days - Number of days to look ahead
	 * @returns {Promise<Array>}
	 */
	async findUpcomingCheckIns(days = 7) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const futureDate = new Date(today);
		futureDate.setDate(futureDate.getDate() + days);

		return await Reservation.find({
			checkInDate: { $gte: today, $lte: futureDate },
			status: { $in: ["confirmed", "pending"] },
		})
			.populate("roomId", "podId quality floor")
			.populate("userId", "name email")
			.sort({ checkInDate: 1 });
	}

	/**
	 * Get current check-outs
	 * @returns {Promise<Array>}
	 */
	async findCurrentCheckOuts() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return await Reservation.find({
			checkOutDate: { $gte: today, $lt: tomorrow },
			status: "checked-in",
		})
			.populate("roomId", "podId quality floor")
			.populate("userId", "name email")
			.sort({ checkOutDate: 1 });
	}
}

export default new ReservationRepository();
