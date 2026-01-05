import ReservationRepository from "../repositories/reservation.repository.js";
import RoomRepository from "../repositories/room.repository.js";

class ReservationService {
	/**
	 * Get all reservations with optional hotel filter
	 * @param {string} hotelId - Optional hotel ID filter
	 * @returns {Promise<Array>}
	 */
	async getAllReservations(hotelId = null) {
		const filter = hotelId ? { hotelId } : {};
		return await ReservationRepository.findAll(filter);
	}

	/**
	 * Get reservations by hotel ID
	 * @param {string} hotelId - Hotel ID
	 * @param {Object} filters - Additional filters (status, date range, etc.)
	 * @returns {Promise<Array>}
	 */
	async getReservationsByHotelId(hotelId, filters = {}) {
		return await ReservationRepository.findByHotelId(hotelId, filters);
	}

	/**
	 * Get reservations by user ID
	 * @param {string} userId - User ID
	 * @returns {Promise<Array>}
	 */
	async getReservationsByUserId(userId) {
		return await ReservationRepository.findByUserId(userId);
	}

	/**
	 * Get a single reservation by ID
	 * @param {string} id - Reservation ID
	 * @returns {Promise<Object|null>}
	 */
	async getReservationById(id) {
		return await ReservationRepository.findById(id);
	}

	/**
	 * Create a new reservation
	 * @param {Object} reservationData - Reservation data
	 * @returns {Promise<Object>}
	 */
	async createReservation(reservationData) {
		const {
			hotelId,
			roomId,
			userId,
			guestName,
			guestEmail,
			checkInDate,
			checkOutDate,
			numberOfGuests,
			totalPrice,
		} = reservationData;

		// Validate required fields
		if (
			!hotelId ||
			!roomId ||
			!userId ||
			!guestName ||
			!guestEmail ||
			!checkInDate ||
			!checkOutDate ||
			!numberOfGuests ||
			totalPrice === undefined
		) {
			throw new Error("Missing required fields");
		}

		// Validate dates
		const checkIn = new Date(checkInDate);
		const checkOut = new Date(checkOutDate);
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		if (checkIn < now) {
			throw new Error("Check-in date cannot be in the past");
		}

		if (checkOut <= checkIn) {
			throw new Error("Check-out date must be after check-in date");
		}

		// Check if room exists and get details
		const room = await RoomRepository.findById(roomId);
		if (!room) {
			throw new Error("Room not found");
		}

		// Validate number of guests doesn't exceed room capacity
		if (numberOfGuests > room.capacity) {
			throw new Error(
				`Number of guests (${numberOfGuests}) exceeds room capacity (${room.capacity})`
			);
		}

		// Check for overlapping reservations
		const overlapping = await ReservationRepository.findOverlapping(
			roomId,
			checkIn,
			checkOut
		);

		if (overlapping.length > 0) {
			throw new Error("Room is not available for the selected dates");
		}

		// Create reservation
		const reservation = await ReservationRepository.create(reservationData);

		// Update room status to reserved
		await RoomRepository.updateStatus(roomId, "reserved");

		return reservation;
	}

	/**
	 * Update a reservation
	 * @param {string} id - Reservation ID
	 * @param {Object} updateData - Data to update
	 * @returns {Promise<Object|null>}
	 */
	async updateReservation(id, updateData) {
		// Prevent updating certain fields
		delete updateData._id;
		delete updateData.createdAt;
		delete updateData.updatedAt;

		// Get existing reservation
		const existing = await ReservationRepository.findById(id);
		if (!existing) {
			throw new Error("Reservation not found");
		}

		// If dates are being updated, check for conflicts
		if (updateData.checkInDate || updateData.checkOutDate) {
			const checkIn = new Date(updateData.checkInDate || existing.checkInDate);
			const checkOut = new Date(
				updateData.checkOutDate || existing.checkOutDate
			);

			if (checkOut <= checkIn) {
				throw new Error("Check-out date must be after check-in date");
			}

			// Check for overlapping reservations (excluding current reservation)
			const overlapping = await ReservationRepository.findOverlapping(
				existing.roomId._id || existing.roomId,
				checkIn,
				checkOut,
				id
			);

			if (overlapping.length > 0) {
				throw new Error("Room is not available for the selected dates");
			}
		}

		// If number of guests is being updated, validate against room capacity
		if (updateData.numberOfGuests) {
			const room = await RoomRepository.findById(
				existing.roomId._id || existing.roomId
			);
			if (updateData.numberOfGuests > room.capacity) {
				throw new Error(
					`Number of guests (${updateData.numberOfGuests}) exceeds room capacity (${room.capacity})`
				);
			}
		}

		return await ReservationRepository.update(id, updateData);
	}

	/**
	 * Cancel a reservation
	 * @param {string} id - Reservation ID
	 * @param {string} reason - Cancellation reason
	 * @returns {Promise<Object|null>}
	 */
	async cancelReservation(id, reason = "") {
		const reservation = await ReservationRepository.findById(id);
		if (!reservation) {
			throw new Error("Reservation not found");
		}

		if (reservation.status === "cancelled") {
			throw new Error("Reservation is already cancelled");
		}

		if (reservation.status === "checked-out") {
			throw new Error("Cannot cancel a completed reservation");
		}

		const updateData = {
			status: "cancelled",
			cancellationReason: reason,
			cancelledAt: new Date(),
			paymentStatus: "refunded",
		};

		// Update room status back to available if not checked in
		if (reservation.status !== "checked-in") {
			await RoomRepository.updateStatus(
				reservation.roomId._id || reservation.roomId,
				"available"
			);
		}

		return await ReservationRepository.update(id, updateData);
	}

	/**
	 * Delete a reservation
	 * @param {string} id - Reservation ID
	 * @returns {Promise<Object|null>}
	 */
	async deleteReservation(id) {
		const reservation = await ReservationRepository.findById(id);
		if (!reservation) {
			throw new Error("Reservation not found");
		}

		// Update room status if reservation is active
		if (["pending", "confirmed", "reserved"].includes(reservation.status)) {
			await RoomRepository.updateStatus(
				reservation.roomId._id || reservation.roomId,
				"available"
			);
		}

		return await ReservationRepository.delete(id);
	}

	/**
	 * Check in a reservation
	 * @param {string} id - Reservation ID
	 * @returns {Promise<Object|null>}
	 */
	async checkIn(id) {
		const reservation = await ReservationRepository.findById(id);
		if (!reservation) {
			throw new Error("Reservation not found");
		}

		if (reservation.status === "checked-in") {
			throw new Error("Guest is already checked in");
		}

		if (reservation.status === "cancelled") {
			throw new Error("Cannot check in a cancelled reservation");
		}

		// Update reservation status
		const updated = await ReservationRepository.updateStatus(id, "checked-in");

		// Update room status to occupied
		await RoomRepository.updateStatus(
			reservation.roomId._id || reservation.roomId,
			"occupied"
		);

		return updated;
	}

	/**
	 * Check out a reservation
	 * @param {string} id - Reservation ID
	 * @returns {Promise<Object|null>}
	 */
	async checkOut(id) {
		const reservation = await ReservationRepository.findById(id);
		if (!reservation) {
			throw new Error("Reservation not found");
		}

		if (reservation.status !== "checked-in") {
			throw new Error("Guest is not currently checked in");
		}

		// Update reservation status
		const updated = await ReservationRepository.updateStatus(id, "checked-out");

		// Update room status to available
		await RoomRepository.updateStatus(
			reservation.roomId._id || reservation.roomId,
			"available"
		);

		return updated;
	}

	/**
	 * Get upcoming check-ins for a hotel
	 * @param {string} hotelId - Hotel ID
	 * @param {number} days - Number of days to look ahead
	 * @returns {Promise<Array>}
	 */
	async getUpcomingCheckIns(hotelId, days = 7) {
		return await ReservationRepository.findUpcomingCheckIns(hotelId, days);
	}

	/**
	 * Get current check-outs for a hotel
	 * @param {string} hotelId - Hotel ID
	 * @returns {Promise<Array>}
	 */
	async getCurrentCheckOuts(hotelId) {
		return await ReservationRepository.findCurrentCheckOuts(hotelId);
	}

	/**
	 * Update reservation status
	 * @param {string} id - Reservation ID
	 * @param {string} status - New status
	 * @returns {Promise<Object|null>}
	 */
	async updateReservationStatus(id, status) {
		const validStatuses = [
			"pending",
			"confirmed",
			"checked-in",
			"checked-out",
			"cancelled",
		];
		if (!validStatuses.includes(status)) {
			throw new Error(
				`Invalid status. Must be one of: ${validStatuses.join(", ")}`
			);
		}

		const reservation = await ReservationRepository.updateStatus(id, status);
		if (!reservation) {
			throw new Error("Reservation not found");
		}
		return reservation;
	}
}

export default new ReservationService();
