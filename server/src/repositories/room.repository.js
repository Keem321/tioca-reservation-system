import Room from "../models/room.model.js";
import Reservation from "../models/reservation.model.js";
import RoomHold from "../models/roomHold.model.js";

class RoomRepository {
	/**
	 * Get all rooms
	 * @param {Object} filter - Filter criteria
	 * @returns {Promise<Array>}
	 */
	async findAll(filter = {}) {
		return await Room.find(filter).sort({ createdAt: -1 });
	}

	/**
	 * Find a room by ID
	 * @param {string} id - Room ID
	 * @returns {Promise<Object|null>}
	 */
	async findById(id) {
		return await Room.findById(id);
	}

	/**
	 * Create a new room
	 * @param {Object} roomData - Room data
	 * @returns {Promise<Object>}
	 */
	async create(roomData) {
		const room = new Room(roomData);
		return await room.save();
	}

	/**
	 * Update a room by ID
	 * @param {string} id - Room ID
	 * @param {Object} updateData - Data to update
	 * @returns {Promise<Object|null>}
	 */
	async update(id, updateData) {
		return await Room.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		});
	}

	/**
	 * Delete a room by ID
	 * @param {string} id - Room ID
	 * @returns {Promise<Object|null>}
	 */
	async delete(id) {
		return await Room.findByIdAndDelete(id);
	}

	/**
	 * Get available rooms for a date range with optional filters
	 * @param {string} checkIn - Check-in date
	 * @param {string} checkOut - Check-out date
	 * @param {string} [floor] - Optional floor filter
	 * @param {string} [quality] - Optional quality filter
	 * @param {string} [excludeSessionId] - Optional session ID to exclude from hold checks
	 * @returns {Promise<Array>}
	 */
	async findAvailableRooms(checkIn, checkOut, floor, quality, excludeSessionId = null) {
		const checkInDate = new Date(checkIn);
		const checkOutDate = new Date(checkOut);
		const now = new Date();

		// Build filter query - only return available rooms
		const filter = {
			status: "available",
		};

		// Add floor filter if provided
		if (floor) {
			filter.floor = floor;
		}

		// Add quality filter if provided
		if (quality) {
			filter.quality = quality;
		}

		// Get all rooms matching the basic filters
		const rooms = await Room.find(filter).sort({ pricePerNight: 1 });

		// Find all overlapping reservations for the date range
		// A reservation overlaps if it's not cancelled and the dates intersect
		const overlappingReservations = await Reservation.find({
			status: { $in: ["pending", "confirmed", "checked-in"] },
			$or: [
				// Reservation starts during the search range
				{
					checkInDate: { $lt: checkOutDate },
					checkOutDate: { $gt: checkInDate },
				},
			],
		}).select("roomId");

		// Get set of booked room IDs from reservations
		const bookedRoomIds = new Set(
			overlappingReservations.map((res) => res.roomId.toString())
		);

		// Find all active holds (non-expired, non-converted) for the date range
		const holdQuery = {
			converted: false,
			holdExpiry: { $gt: now },
			$or: [
				{
					checkInDate: { $lt: checkOutDate },
					checkOutDate: { $gt: checkInDate },
				},
			],
		};

		// Exclude holds from the current session if sessionId provided
		if (excludeSessionId) {
			holdQuery.sessionId = { $ne: excludeSessionId };
		}

		const activeHolds = await RoomHold.find(holdQuery).select("roomId");

		// Get set of held room IDs
		const heldRoomIds = new Set(
			activeHolds.map((hold) => hold.roomId.toString())
		);

		// Filter out rooms that have overlapping reservations OR active holds
		const availableRooms = rooms.filter(
			(room) => !bookedRoomIds.has(room._id.toString()) && !heldRoomIds.has(room._id.toString())
		);

		return availableRooms;
	}

	/**
	 * Get recommended rooms when fully available rooms are limited
	 * Includes rooms with up to 33% unavailability and cross-floor suggestions
	 * @param {string} checkIn - Check-in date
	 * @param {string} checkOut - Check-out date
	 * @param {string} [floor] - Requested floor filter
	 * @param {string} [quality] - Optional quality filter
	 * @param {string} [excludeSessionId] - Optional session ID to exclude from hold checks
	 * @returns {Promise<Array>} Array of recommended rooms with availability info
	 */
	async findRecommendedRooms(checkIn, checkOut, floor, quality, excludeSessionId = null) {
		const checkInDate = new Date(checkIn);
		const checkOutDate = new Date(checkOut);
		const now = new Date();
		const totalDays = Math.ceil(
			(checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
		);

		// Build base filter - only available rooms
		const filter = {
			status: "available",
		};

		// Add quality filter if provided
		if (quality) {
			filter.quality = quality;
		}

		// Get alternative floors for cross-floor suggestions
		const alternativeFloors = [];
		if (floor === "women-only" || floor === "men-only") {
			alternativeFloors.push("business");
		}

		// Build filter for recommended rooms (original floor + alternatives)
		const recommendedFilter = { ...filter };
		if (floor && alternativeFloors.length > 0) {
			recommendedFilter.floor = { $in: [floor, ...alternativeFloors] };
		} else if (floor) {
			recommendedFilter.floor = floor;
		}

		// Get all potential recommended rooms
		const rooms = await Room.find(recommendedFilter).sort({ pricePerNight: 1 });

		// Get all reservations that overlap with the date range
		const overlappingReservations = await Reservation.find({
			status: { $in: ["pending", "confirmed", "checked-in"] },
			$or: [
				{
					checkInDate: { $lt: checkOutDate },
					checkOutDate: { $gt: checkInDate },
				},
			],
		});

		// Get all active holds that overlap with the date range
		const holdQuery = {
			converted: false,
			holdExpiry: { $gt: now },
			$or: [
				{
					checkInDate: { $lt: checkOutDate },
					checkOutDate: { $gt: checkInDate },
				},
			],
		};

		// Exclude holds from the current session if sessionId provided
		if (excludeSessionId) {
			holdQuery.sessionId = { $ne: excludeSessionId };
		}

		const activeHolds = await RoomHold.find(holdQuery);

		// Calculate availability for each room
		const roomsWithAvailability = rooms.map((room) => {
			const roomReservations = overlappingReservations.filter(
				(res) => res.roomId.toString() === room._id.toString()
			);

			const roomHolds = activeHolds.filter(
				(hold) => hold.roomId.toString() === room._id.toString()
			);

			// If room has no reservations or holds, skip (it's fully available)
			if (roomReservations.length === 0 && roomHolds.length === 0) {
				return null;
			}

			// Calculate unavailable days from reservations
			let unavailableDays = 0;
			roomReservations.forEach((res) => {
				const resStart = new Date(res.checkInDate);
				const resEnd = new Date(res.checkOutDate);
				const overlapStart = new Date(Math.max(resStart, checkInDate));
				const overlapEnd = new Date(Math.min(resEnd, checkOutDate));
				const overlapDays = Math.ceil(
					(overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)
				);
				unavailableDays += overlapDays;
			});

			// Calculate unavailable days from holds
			roomHolds.forEach((hold) => {
				const holdStart = new Date(hold.checkInDate);
				const holdEnd = new Date(hold.checkOutDate);
				const overlapStart = new Date(Math.max(holdStart, checkInDate));
				const overlapEnd = new Date(Math.min(holdEnd, checkOutDate));
				const overlapDays = Math.ceil(
					(overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)
				);
				unavailableDays += overlapDays;
			});

			const unavailablePercent = (unavailableDays / totalDays) * 100;

			// Only include if unavailability is <= 33%
			if (unavailablePercent > 33) {
				return null;
			}

			const availableDays = totalDays - unavailableDays;
			const availablePercent = ((availableDays / totalDays) * 100).toFixed(0);

			return {
				...room.toObject(),
				availabilityInfo: {
					availableDays,
					totalDays,
					availablePercent: parseInt(availablePercent),
					isAlternativeFloor: floor && room.floor !== floor,
				},
			};
		});

		// Filter out nulls and limit to 5
		const recommended = roomsWithAvailability
			.filter((room) => room !== null)
			.slice(0, 5);

		return recommended;
	}

	/**
	 * Generate next pod ID for a floor/zone (format: FloorNumber + 2-digit sequence)
	 * Maps zones to floor numbers: women-only=1, men-only=2, couples=3, business=4
	 * E.g., "301" for couples floor, Pod 1
	 * @param {string} floorZone - Floor zone (women-only, men-only, couples, business)
	 * @returns {Promise<string>}
	 */
	async generateNextPodId(floorZone) {
		// Map zone strings to numeric floors
		const zoneToFloor = {
			"women-only": 1,
			"men-only": 2,
			couples: 3,
			business: 4,
		};

		const numericFloor = zoneToFloor[floorZone];
		if (!numericFloor) {
			throw new Error(`Invalid floor zone: ${floorZone}`);
		}

		// Find the highest existing pod ID for this floor
		const floorPrefix = numericFloor.toString();
		const regex = new RegExp(`^${floorPrefix}\\d{2}$`);

		const lastPod = await Room.findOne({
			podId: { $regex: regex },
		}).sort({ podId: -1 });

		let nextSequence = 1;
		if (lastPod) {
			const lastNumber = parseInt(lastPod.podId.substring(1));
			nextSequence = lastNumber + 1;
		}

		if (nextSequence > 99) {
			throw new Error(
				`${floorZone} floor has reached maximum capacity (99 pods)`
			);
		}

		// Format: FloorNumber + 2-digit sequence (e.g., "301" for couples floor, Pod 1)
		return `${numericFloor}${String(nextSequence).padStart(2, "0")}`;
	}

	/**
	 * Update room status
	 * @param {string} id - Room ID
	 * @param {string} status - New status
	 * @returns {Promise<Object|null>}
	 */
	async updateStatus(id, status) {
		return await Room.findByIdAndUpdate(id, { status }, { new: true });
	}
}

export default new RoomRepository();
