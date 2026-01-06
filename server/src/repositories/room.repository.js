import Room from "../models/room.model.js";

class RoomRepository {
	/**
	 * Get all rooms with optional filtering by hotel
	 * @param {Object} filter - Filter criteria
	 * @returns {Promise<Array>}
	 */
	async findAll(filter = {}) {
		return await Room.find(filter)
			.populate("hotelId", "name address")
			.sort({ createdAt: -1 });
	}

	/**
	 * Get rooms by hotel ID
	 * @param {string} hotelId - Hotel ID
	 * @returns {Promise<Array>}
	 */
	async findByHotelId(hotelId) {
		const floorOrder = {
			"women-only": 0,
			"men-only": 1,
			couples: 2,
			business: 3,
		};
		return await Room.find({ hotelId }).sort({ floor: 1, podId: 1 });
	}

	/**
	 * Find a room by ID
	 * @param {string} id - Room ID
	 * @returns {Promise<Object|null>}
	 */
	async findById(id) {
		return await Room.findById(id).populate("hotelId", "name address");
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
	 * Get available rooms for a date range
	 * @param {string} hotelId - Hotel ID
	 * @param {Date} checkIn - Check-in date
	 * @param {Date} checkOut - Check-out date
	 * @returns {Promise<Array>}
	 */
	async findAvailableRooms(hotelId, checkIn, checkOut) {
		// This will be enhanced later with reservation checking
		return await Room.find({
			hotelId,
			status: { $in: ["available", "reserved"] },
		}).sort({ pricePerNight: 1 });
	}

	/**
	 * Generate next pod ID for a floor/zone (format: FloorNumber + 2-digit sequence)
	 * Maps zones to floor numbers: women-only=1, men-only=2, couples=3, business=4
	 * E.g., "301" for couples floor, Pod 1
	 * @param {string} hotelId - Hotel ID
	 * @param {string} floorZone - Floor zone (women-only, men-only, couples, business)
	 * @returns {Promise<string>}
	 */
	async generateNextPodId(hotelId, floorZone) {
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
			hotelId,
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
