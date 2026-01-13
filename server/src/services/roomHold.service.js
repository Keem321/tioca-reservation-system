import RoomHoldRepository from "../repositories/roomHold.repository.js";
import RoomRepository from "../repositories/room.repository.js";
import ReservationRepository from "../repositories/reservation.repository.js";

// Hold durations in minutes
const HOLD_DURATIONS = {
	confirmation: 5, // 5 minutes on confirmation page
	payment: 10, // 10 minutes on payment page
};

class RoomHoldService {
	/**
	 * Create a new room hold
	 * @param {Object} holdData - { roomId, checkInDate, checkOutDate, sessionId, userId?, stage? }
	 * @returns {Promise<Object>}
	 */
	async createHold(holdData) {
		const {
			roomId,
			checkInDate,
			checkOutDate,
			sessionId,
			userId,
			stage = "confirmation",
		} = holdData;

		// Validate required fields
		if (!roomId || !checkInDate || !checkOutDate || !sessionId) {
			throw new Error("Missing required fields for hold");
		}

		const checkIn = new Date(checkInDate);
		const checkOut = new Date(checkOutDate);

		// Validate dates
		if (checkOut <= checkIn) {
			throw new Error("Check-out date must be after check-in date");
		}

		// Verify room exists
		const room = await RoomRepository.findById(roomId);
		if (!room) {
			throw new Error("Room not found");
		}

		// Check for existing reservations (excluding cancelled)
		const overlappingReservations = await ReservationRepository.findOverlapping(
			roomId,
			checkIn,
			checkOut
		);

		if (overlappingReservations.length > 0) {
			throw new Error("Room is already booked for the selected dates");
		}

		// Check for other active holds (excluding this session)
		const overlappingHolds = await RoomHoldRepository.findActiveHolds(
			roomId,
			checkIn,
			checkOut,
			sessionId
		);

		if (overlappingHolds.length > 0) {
			throw new Error("Room is currently being booked by another user");
		}

		// Check if this session already has an active hold for this room and dates
		const existingSessionHolds = await RoomHoldRepository.findBySessionId(
			sessionId,
			true
		);
		const existingHold = existingSessionHolds.find(
			(hold) =>
				hold.roomId._id.toString() === roomId &&
				new Date(hold.checkInDate).getTime() === checkIn.getTime() &&
				new Date(hold.checkOutDate).getTime() === checkOut.getTime()
		);

		if (existingHold) {
			// Return existing hold instead of creating duplicate
			return existingHold;
		}

		// Calculate expiry time based on stage
		const expiryMinutes = HOLD_DURATIONS[stage] || HOLD_DURATIONS.confirmation;
		const holdExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

		// Create the hold
		const hold = await RoomHoldRepository.create({
			roomId,
			checkInDate: checkIn,
			checkOutDate: checkOut,
			sessionId,
			userId,
			stage,
			holdExpiry,
		});

		// Populate room details
		await hold.populate("roomId", "podId quality floor pricePerNight");

		return hold;
	}

	/**
	 * Extend an existing hold
	 * @param {string} holdId - Hold ID
	 * @param {string} sessionId - Session ID for verification
	 * @param {string} newStage - Optional new stage (confirmation or payment)
	 * @returns {Promise<Object>}
	 */
	async extendHold(holdId, sessionId, newStage = null) {
		const hold = await RoomHoldRepository.findById(holdId);

		if (!hold) {
			throw new Error("Hold not found");
		}

		// Verify session owns this hold
		if (hold.sessionId !== sessionId) {
			throw new Error("Unauthorized: Hold belongs to a different session");
		}

		// If hold was already converted, it's okay - reservation was created successfully
		// Just return the hold without extending (payment can proceed)
		if (hold.converted) {
			console.log(
				"[Hold] Hold already converted to reservation - skipping extension"
			);
			return hold;
		}

		// Check if hold is already expired
		if (new Date() > new Date(hold.holdExpiry)) {
			throw new Error("Hold has expired and cannot be extended");
		}

		// Calculate new expiry time
		const stage = newStage || hold.stage;
		const expiryMinutes = HOLD_DURATIONS[stage] || HOLD_DURATIONS.confirmation;
		const newExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

		// Update hold
		if (newStage && newStage !== hold.stage) {
			return await RoomHoldRepository.updateStage(holdId, newStage, newExpiry);
		} else {
			return await RoomHoldRepository.extendHold(holdId, newExpiry);
		}
	}

	/**
	 * Release a hold
	 * @param {string} holdId - Hold ID
	 * @param {string} sessionId - Session ID for verification
	 * @returns {Promise<void>}
	 */
	async releaseHold(holdId, sessionId) {
		const hold = await RoomHoldRepository.findById(holdId);

		if (!hold) {
			// Hold doesn't exist, consider it already released
			return;
		}

		// Verify session owns this hold
		if (hold.sessionId !== sessionId) {
			throw new Error("Unauthorized: Hold belongs to a different session");
		}

		await RoomHoldRepository.release(holdId);
	}

	/**
	 * Get active holds for a session
	 * @param {string} sessionId - Session ID
	 * @returns {Promise<Array>}
	 */
	async getSessionHolds(sessionId) {
		return await RoomHoldRepository.findBySessionId(sessionId, true);
	}

	/**
	 * Mark a hold as converted (when reservation is created)
	 * @param {string} holdId - Hold ID
	 * @param {string} reservationId - Reservation ID
	 * @returns {Promise<Object>}
	 */
	async convertHold(holdId, reservationId) {
		return await RoomHoldRepository.markAsConverted(holdId, reservationId);
	}

	/**
	 * Cleanup expired holds (for background job)
	 * @returns {Promise<Object>}
	 */
	async cleanupExpiredHolds() {
		return await RoomHoldRepository.cleanupExpired();
	}

	/**
	 * Validate if a hold is still active and belongs to the session
	 * @param {string} holdId - Hold ID
	 * @param {string} sessionId - Session ID
	 * @returns {Promise<boolean>}
	 */
	async validateHold(holdId, sessionId) {
		const hold = await RoomHoldRepository.findById(holdId);

		if (!hold) {
			return false;
		}

		// Check session ownership
		if (hold.sessionId !== sessionId) {
			return false;
		}

		// Check expiry
		if (new Date() > new Date(hold.holdExpiry)) {
			return false;
		}

		// Check if converted
		if (hold.converted) {
			return false;
		}

		return true;
	}
}

export default new RoomHoldService();
