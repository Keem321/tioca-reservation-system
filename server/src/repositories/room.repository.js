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
		return await Room.find({ hotelId }).sort({ floor: 1, roomNumber: 1 });
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
