import RoomRepository from "../repositories/room.repository.js";

class RoomService {
	/**
	 * Get all rooms with optional hotel filter
	 * @param {string} hotelId - Optional hotel ID filter
	 * @returns {Promise<Array>}
	 */
	async getAllRooms(hotelId = null) {
		const filter = hotelId ? { hotelId } : {};
		return await RoomRepository.findAll(filter);
	}

	/**
	 * Get rooms by hotel ID
	 * @param {string} hotelId - Hotel ID
	 * @returns {Promise<Array>}
	 */
	async getRoomsByHotelId(hotelId) {
		return await RoomRepository.findByHotelId(hotelId);
	}

	/**
	 * Get a single room by ID
	 * @param {string} id - Room ID
	 * @returns {Promise<Object|null>}
	 */
	async getRoomById(id) {
		return await RoomRepository.findById(id);
	}

	/**
	 * Create a new room
	 * @param {Object} roomData - Room data
	 * @returns {Promise<Object>}
	 */
	async createRoom(roomData) {
		// Validate required fields
		const { hotelId, quality, floor, pricePerNight } = roomData;

		if (!hotelId || !quality || !floor || pricePerNight === undefined) {
			throw new Error(
				"Missing required fields (hotelId, quality, floor, pricePerNight)"
			);
		}

		// Validate floor is a valid zone
		const validZones = ["women-only", "men-only", "couples", "business"];
		if (!validZones.includes(floor)) {
			throw new Error(
				`Invalid floor zone. Must be one of: ${validZones.join(", ")}`
			);
		}

		// Validate price is non-negative
		if (pricePerNight < 0) {
			throw new Error("Price per night cannot be negative");
		}

		// Auto-generate pod ID if not provided
		if (!roomData.podId) {
			roomData.podId = await RoomRepository.generateNextPodId(hotelId, floor);
		}

		// Create the room
		return await RoomRepository.create(roomData);
	}

	/**
	 * Update a room
	 * @param {string} id - Room ID
	 * @param {Object} updateData - Data to update
	 * @returns {Promise<Object|null>}
	 */
	async updateRoom(id, updateData) {
		// Prevent updating certain fields
		delete updateData._id;
		delete updateData.createdAt;
		delete updateData.updatedAt;
		delete updateData.capacity; // Capacity is auto-calculated based on floor

		// Validate price if being updated
		if (
			updateData.pricePerNight !== undefined &&
			updateData.pricePerNight < 0
		) {
			throw new Error("Price per night cannot be negative");
		}

		const room = await RoomRepository.update(id, updateData);
		if (!room) {
			throw new Error("Room not found");
		}
		return room;
	}

	/**
	 * Delete a room
	 * @param {string} id - Room ID
	 * @returns {Promise<Object|null>}
	 */
	async deleteRoom(id) {
		const room = await RoomRepository.delete(id);
		if (!room) {
			throw new Error("Room not found");
		}
		return room;
	}

	/**
	 * Update room status
	 * @param {string} id - Room ID
	 * @param {string} status - New status
	 * @returns {Promise<Object|null>}
	 */
	async updateRoomStatus(id, status) {
		const validStatuses = ["available", "occupied", "maintenance", "reserved"];
		if (!validStatuses.includes(status)) {
			throw new Error(
				`Invalid status. Must be one of: ${validStatuses.join(", ")}`
			);
		}

		const room = await RoomRepository.updateStatus(id, status);
		if (!room) {
			throw new Error("Room not found");
		}
		return room;
	}

	/**
	 * Get available rooms for a date range
	 * @param {string} hotelId - Hotel ID
	 * @param {Date} checkIn - Check-in date
	 * @param {Date} checkOut - Check-out date
	 * @returns {Promise<Array>}
	 */
	async getAvailableRooms(hotelId, checkIn, checkOut) {
		if (!checkIn || !checkOut) {
			throw new Error("Check-in and check-out dates are required");
		}

		if (new Date(checkIn) >= new Date(checkOut)) {
			throw new Error("Check-out date must be after check-in date");
		}

		return await RoomRepository.findAvailableRooms(hotelId, checkIn, checkOut);
	}
}

export default new RoomService();
