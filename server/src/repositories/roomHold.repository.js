import RoomHold from "../models/roomHold.model.js";

class RoomHoldRepository {
	/**
	 * Create a new room hold
	 * @param {Object} holdData - Hold data
	 * @returns {Promise<Object>}
	 */
	async create(holdData) {
		const hold = new RoomHold(holdData);
		return await hold.save();
	}

	/**
	 * Find a hold by ID
	 * @param {string} id - Hold ID
	 * @returns {Promise<Object|null>}
	 */
	async findById(id) {
		return await RoomHold.findById(id)
			.populate("roomId", "podId quality floor pricePerNight")
			.populate("userId", "name email");
	}

	/**
	 * Find active (non-expired, non-converted) holds for a specific room and date range
	 * @param {string} roomId - Room ID
	 * @param {Date} checkIn - Check-in date
	 * @param {Date} checkOut - Check-out date
	 * @param {string} excludeSessionId - Optional session ID to exclude
	 * @returns {Promise<Array>}
	 */
	async findActiveHolds(roomId, checkIn, checkOut, excludeSessionId = null) {
		const now = new Date();
		
		const query = {
			roomId,
			converted: false,
			holdExpiry: { $gt: now }, // Not expired
			$or: [
				{ checkInDate: { $lt: checkOut, $gte: checkIn } },
				{ checkOutDate: { $gt: checkIn, $lte: checkOut } },
				{ checkInDate: { $lte: checkIn }, checkOutDate: { $gte: checkOut } },
			],
		};

		// If sessionId provided, exclude holds from that session
		if (excludeSessionId) {
			query.sessionId = { $ne: excludeSessionId };
		}

		return await RoomHold.find(query);
	}

	/**
	 * Find holds by session ID
	 * @param {string} sessionId - Session ID
	 * @param {boolean} activeOnly - Only return active (non-expired, non-converted) holds
	 * @returns {Promise<Array>}
	 */
	async findBySessionId(sessionId, activeOnly = true) {
		const query = { sessionId };
		
		if (activeOnly) {
			const now = new Date();
			query.converted = false;
			query.holdExpiry = { $gt: now };
		}

		return await RoomHold.find(query)
			.populate("roomId", "podId quality floor pricePerNight")
			.sort({ createdAt: -1 });
	}

	/**
	 * Extend the expiry time of a hold
	 * @param {string} id - Hold ID
	 * @param {Date} newExpiry - New expiry date
	 * @returns {Promise<Object|null>}
	 */
	async extendHold(id, newExpiry) {
		return await RoomHold.findByIdAndUpdate(
			id,
			{ holdExpiry: newExpiry },
			{ new: true }
		).populate("roomId", "podId quality floor pricePerNight");
	}

	/**
	 * Update hold stage (confirmation -> payment)
	 * @param {string} id - Hold ID
	 * @param {string} stage - New stage
	 * @param {Date} newExpiry - New expiry date
	 * @returns {Promise<Object|null>}
	 */
	async updateStage(id, stage, newExpiry) {
		return await RoomHold.findByIdAndUpdate(
			id,
			{ stage, holdExpiry: newExpiry },
			{ new: true }
		).populate("roomId", "podId quality floor pricePerNight");
	}

	/**
	 * Mark a hold as converted (when reservation is created)
	 * @param {string} id - Hold ID
	 * @param {string} reservationId - The reservation ID it was converted to
	 * @returns {Promise<Object|null>}
	 */
	async markAsConverted(id, reservationId) {
		return await RoomHold.findByIdAndUpdate(
			id,
			{ converted: true, reservationId },
			{ new: true }
		);
	}

	/**
	 * Release (delete) a hold
	 * @param {string} id - Hold ID
	 * @returns {Promise<Object|null>}
	 */
	async release(id) {
		return await RoomHold.findByIdAndDelete(id);
	}

	/**
	 * Release all holds for a session
	 * @param {string} sessionId - Session ID
	 * @returns {Promise<Object>}
	 */
	async releaseBySession(sessionId) {
		return await RoomHold.deleteMany({ sessionId });
	}

	/**
	 * Find and delete expired holds (for manual cleanup)
	 * @returns {Promise<Object>}
	 */
	async cleanupExpired() {
		const now = new Date();
		return await RoomHold.deleteMany({
			holdExpiry: { $lt: now },
			converted: false,
		});
	}

	/**
	 * Get all active holds for a room
	 * @param {string} roomId - Room ID
	 * @returns {Promise<Array>}
	 */
	async findActiveHoldsByRoom(roomId) {
		const now = new Date();
		return await RoomHold.find({
			roomId,
			converted: false,
			holdExpiry: { $gt: now },
		}).sort({ createdAt: -1 });
	}
}

export default new RoomHoldRepository();
