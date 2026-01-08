import ReservationRepository from "../repositories/reservation.repository.js";
import RoomRepository from "../repositories/room.repository.js";

class ReservationService {
	/**
	 * Get all reservations with optional filters
	 * @param {Object} filters - Optional filters (status, date range, etc.)
	 * @returns {Promise<Array>}
	 */
	async getAllReservations(filters = {}) {
		return await ReservationRepository.findAll(filters);
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
			roomId,
			userId,
			guestName,
			guestEmail,
			checkInDate,
			checkOutDate,
			numberOfGuests,
			totalPrice,
		} = reservationData;

		// Validate required fields (userId is optional for guest bookings)
		if (
			!roomId ||
			!guestName ||
			!guestEmail ||
			!checkInDate ||
			!checkOutDate ||
			!numberOfGuests ||
			totalPrice === undefined
		) {
			throw new Error("Missing required fields");
		}

		// Validate dates (include time) and same-day buffer
		const checkIn = new Date(checkInDate);
		const checkOut = new Date(checkOutDate);
		const now = new Date();
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (checkIn < now) {
			throw new Error("Check-in date cannot be in the past");
		}

		// If check-in is today, enforce 2-hour prep buffer
		const isToday = checkIn.toDateString() === today.toDateString();
		if (isToday) {
			const minArrival = new Date(now.getTime() + 2 * 60 * 60 * 1000);
			if (checkIn < minArrival) {
				throw new Error("Check-in time must be at least 2 hours from now");
			}
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

		// Populate room details before returning
		await reservation.populate("roomId", "podId quality floor pricePerNight");

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
	 * Get upcoming check-ins
	 * @param {number} days - Number of days to look ahead
	 * @returns {Promise<Array>}
	 */
	async getUpcomingCheckIns(days = 7) {
		return await ReservationRepository.findUpcomingCheckIns(days);
	}

	/**
	 * Get current check-outs
	 * @returns {Promise<Array>}
	 */
	async getCurrentCheckOuts() {
		return await ReservationRepository.findCurrentCheckOuts();
	}

	/**
	 * Get available 30-minute time slots for a room on a given date
	 * Excludes slots where another check-in or check-out occurs and applies a 2-hour buffer if date is today.
	 * @param {string} roomId
	 * @param {string} dateString - YYYY-MM-DD
	 * @returns {Promise<Array<string>>}
	 */
	async getAvailableTimeSlots(roomId, dateString) {
		if (!roomId || !dateString) {
			throw new Error("roomId and date are required");
		}

		const dayStart = new Date(`${dateString}T00:00:00`);
		const dayEnd = new Date(`${dateString}T23:59:59.999`);

		const reservations = await ReservationRepository.findForRoomOnDate(
			roomId,
			dayStart,
			dayEnd
		);

		const occupied = new Set();
		const toTimeString = (d) => d.toISOString().slice(11, 16);
		reservations.forEach((r) => {
			if (r.checkInDate) occupied.add(toTimeString(new Date(r.checkInDate)));
			if (r.checkOutDate) occupied.add(toTimeString(new Date(r.checkOutDate)));
		});

		// If date is today, enforce 2-hour buffer from now
		const now = new Date();
		const isToday = dayStart.toDateString() === now.toDateString();
		const minArrival = isToday
			? new Date(now.getTime() + 2 * 60 * 60 * 1000)
			: null;

		const slots = [];
		for (let h = 0; h < 24; h++) {
			for (let m of [0, 30]) {
				const slot = new Date(dayStart);
				slot.setHours(h, m, 0, 0);

				// For today, compare times directly: current slot time vs current time + 2 hours
				if (isToday && minArrival) {
					const slotTime = h * 60 + m; // minutes since midnight for this slot
					const minArrivalMinutes =
						minArrival.getHours() * 60 + minArrival.getMinutes();
					if (slotTime < minArrivalMinutes) {
						continue;
					}
				}

				const slotLabel = slot.toISOString().slice(11, 16);
				if (!occupied.has(slotLabel)) {
					slots.push(slotLabel);
				}
			}
		}

		return slots;
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
