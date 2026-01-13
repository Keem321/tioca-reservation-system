import RoomRepository from "../repositories/room.repository.js";
import Offering from "../models/offering.model.js";

class RoomService {
	/**
	 * Get all rooms with offering details populated
	 * @param {Object} filter - Optional filter criteria
	 * @returns {Promise<Array>}
	 */
	async getAllRooms(filter = {}) {
		const rooms = await RoomRepository.findAll(filter);
		return await this._populateOfferingData(rooms);
	}

	/**
	 * Populate offering data for room(s)
	 * @param {Object|Array} rooms - Room(s) to populate
	 * @returns {Promise<Object|Array>}
	 */
	async _populateOfferingData(rooms) {
		if (Array.isArray(rooms)) {
			for (let i = 0; i < rooms.length; i++) {
				if (rooms[i].offeringId) {
					const offering = await Offering.findById(rooms[i].offeringId);
					rooms[i] = rooms[i].toObject ? rooms[i].toObject() : rooms[i];
					rooms[i].offering = offering;
				}
			}
		} else {
			if (rooms.offeringId) {
				const offering = await Offering.findById(rooms.offeringId);
				rooms = rooms.toObject ? rooms.toObject() : rooms;
				rooms.offering = offering;
			}
		}
		return rooms;
	}

	/**
	 * Get a single room by ID with offering details
	 * @param {string} id - Room ID
	 * @returns {Promise<Object|null>}
	 */
	async getRoomById(id) {
		const room = await RoomRepository.findById(id);
		if (!room) return null;
		return await this._populateOfferingData(room);
	}

	/**
	 * Create a new room
	 * @param {Object} roomData - Room data
	 * @returns {Promise<Object>}
	 */
	async createRoom(roomData) {
		// Validate required fields
		const { quality, floor, offeringId } = roomData;

		if (!quality || !floor || !offeringId) {
			throw new Error("Missing required fields (quality, floor, offeringId)");
		}

		// Validate floor is a valid zone
		const validZones = ["women-only", "men-only", "couples", "business"];
		if (!validZones.includes(floor)) {
			throw new Error(
				`Invalid floor zone. Must be one of: ${validZones.join(", ")}`
			);
		}

		// Validate offering exists
		const offering = await Offering.findById(offeringId);
		if (!offering) {
			throw new Error("Invalid offering ID");
		}

		// Auto-generate pod ID if not provided
		if (!roomData.podId) {
			roomData.podId = await RoomRepository.generateNextPodId(floor);
		}

		// Create the room
		const room = await RoomRepository.create(roomData);
		return await this._populateOfferingData(room);
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

		// Validate offering if being updated
		if (updateData.offeringId) {
			const offering = await Offering.findById(updateData.offeringId);
			if (!offering) {
				throw new Error("Invalid offering ID");
			}
		}

		const room = await RoomRepository.update(id, updateData);
		if (!room) {
			throw new Error("Room not found");
		}
		return await this._populateOfferingData(room);
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
	 * Get available rooms for a date range with optional filters
	 * @param {string} checkIn - Check-in date
	 * @param {string} checkOut - Check-out date
	 * @param {string} [floor] - Optional floor filter
	 * @param {string} [quality] - Optional quality filter
	 * @param {string} [excludeSessionId] - Optional session ID to exclude from hold checks
	 * @returns {Promise<Array>}
	 */
	async getAvailableRooms(
		checkIn,
		checkOut,
		floor,
		quality,
		excludeSessionId = null
	) {
		if (!checkIn || !checkOut) {
			throw new Error("Check-in and check-out dates are required");
		}

		if (new Date(checkIn) >= new Date(checkOut)) {
			throw new Error("Check-out date must be after check-in date");
		}

		const rooms = await RoomRepository.findAvailableRooms(
			checkIn,
			checkOut,
			floor,
			quality,
			excludeSessionId
		);
		return await this._populateOfferingData(rooms);
	}

	/**
	 * Get recommended rooms with partial availability
	 * @param {string} checkIn - Check-in date
	 * @param {string} checkOut - Check-out date
	 * @param {string} [floor] - Optional floor filter
	 * @param {string} [quality] - Optional quality filter
	 * @param {string} [excludeSessionId] - Optional session ID to exclude from hold checks
	 * @returns {Promise<Array>}
	 */
	async getRecommendedRooms(
		checkIn,
		checkOut,
		floor,
		quality,
		excludeSessionId = null
	) {
		if (!checkIn || !checkOut) {
			throw new Error("Check-in and check-out dates are required");
		}

		if (new Date(checkIn) >= new Date(checkOut)) {
			throw new Error("Check-out date must be after check-in date");
		}

		const rooms = await RoomRepository.findRecommendedRooms(
			checkIn,
			checkOut,
			floor,
			quality,
			excludeSessionId
		);
		return await this._populateOfferingData(rooms);
	}
}

export default new RoomService();
