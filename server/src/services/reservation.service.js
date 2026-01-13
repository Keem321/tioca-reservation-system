import ReservationRepository from "../repositories/reservation.repository.js";
import RoomRepository from "../repositories/room.repository.js";
import RoomHoldRepository from "../repositories/roomHold.repository.js";
import PricingService from "./pricing.service.js";
import mongoose from "mongoose";

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
	 * @param {Object} reservationData - Reservation data (includes holdId and sessionId if from a hold)
	 *   - roomId, userId, guestName, guestEmail, checkInDate, checkOutDate, numberOfGuests
	 *   - offeringId (room offering ID), selectedAmenities (array of offering IDs)
	 *   - holdId, sessionId (optional)
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
			offeringId,
			selectedAmenities = [],
			holdId,
			sessionId,
		} = reservationData;

		// Validate required fields (userId is optional for guest bookings)
		if (
			!roomId ||
			!guestName ||
			!guestEmail ||
			!checkInDate ||
			!checkOutDate ||
			!numberOfGuests ||
			!offeringId
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

		// Use a transaction to ensure atomicity
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
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

			// If holdId provided, verify the hold exists and belongs to this session
			if (holdId && sessionId) {
				const hold = await RoomHoldRepository.findById(holdId);

				if (!hold) {
					throw new Error(
						"Hold not found. The room may no longer be available."
					);
				}

				// Verify hold ownership
				if (hold.sessionId !== sessionId) {
					throw new Error("Hold belongs to a different session");
				}

				// Verify hold hasn't expired
				if (new Date() > new Date(hold.holdExpiry)) {
					throw new Error("Hold has expired. Please search for rooms again.");
				}

				// Verify hold hasn't been converted already
				if (hold.converted) {
					throw new Error("Hold has already been converted to a reservation");
				}

				// Verify hold dates match reservation dates (compare date parts only, not times)
				const holdCheckInDate = new Date(hold.checkInDate)
					.toISOString()
					.split("T")[0];
				const holdCheckOutDate = new Date(hold.checkOutDate)
					.toISOString()
					.split("T")[0];
				const reservationCheckInDate = checkIn.toISOString().split("T")[0];
				const reservationCheckOutDate = checkOut.toISOString().split("T")[0];

				if (
					holdCheckInDate !== reservationCheckInDate ||
					holdCheckOutDate !== reservationCheckOutDate
				) {
					throw new Error(
						`Reservation dates do not match the hold. Hold: ${holdCheckInDate} to ${holdCheckOutDate}, Reservation: ${reservationCheckInDate} to ${reservationCheckOutDate}`
					);
				}

				// Verify hold room matches reservation room
				const holdRoomId = hold.roomId._id
					? hold.roomId._id.toString()
					: hold.roomId.toString();
				if (holdRoomId !== roomId) {
					throw new Error("Reservation room does not match the hold");
				}
			}

			// Check for overlapping reservations (excluding current session's holds if holdId provided)
			const overlapping = await ReservationRepository.findOverlapping(
				roomId,
				checkIn,
				checkOut
			);

			if (overlapping.length > 0) {
				throw new Error("Room is not available for the selected dates");
			}

			// Check for other active holds (excluding this session if holdId provided)
			const overlappingHolds = await RoomHoldRepository.findActiveHolds(
				roomId,
				checkIn,
				checkOut,
				sessionId // Exclude holds from this session
			);

			if (overlappingHolds.length > 0) {
				throw new Error("Room is currently being booked by another user");
			}

			// Calculate number of nights
			const numberOfNights = Math.ceil(
				(checkOut - checkIn) / (1000 * 60 * 60 * 24)
			);

			// Calculate pricing using pricing service
			const pricingData = await PricingService.calculateReservationPrice(
				offeringId,
				numberOfNights,
				selectedAmenities
			);

			// Build amenities data for storage
			const amenitiesData = [];
			if (selectedAmenities.length > 0) {
				const amenities = await PricingService.getAmenityOfferings();
				for (const amenityId of selectedAmenities) {
					const amenity = amenities.find(
						(a) => a._id.toString() === amenityId.toString()
					);
					if (amenity) {
						amenitiesData.push({
							offeringId: amenity._id,
							name: amenity.name,
							price: amenity.basePrice,
							priceType: amenity.priceType,
						});
					}
				}
			}

			// Create reservation with new structure
			const reservationPayload = {
				roomId,
				userId,
				guestName,
				guestEmail,
				checkInDate,
				checkOutDate,
				numberOfGuests,
				baseRoomPrice: pricingData.basePrice / numberOfNights, // Store per-night rate
				selectedAmenities: amenitiesData,
				numberOfNights,
				totalPrice: pricingData.totalPrice,
			};

			const reservation = await ReservationRepository.create(
				reservationPayload
			);

			// Populate room and offering details before returning
			await reservation.populate("roomId", "podId quality floor");

			// If hold exists, mark it as converted
			if (holdId) {
				await RoomHoldRepository.markAsConverted(holdId, reservation._id);
			}

			// Update room status to reserved
			await RoomRepository.updateStatus(roomId, "reserved");

			// Commit the transaction
			await session.commitTransaction();
			session.endSession();

			return reservation;
		} catch (error) {
			// Abort transaction on error
			await session.abortTransaction();
			session.endSession();
			throw error;
		}
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
