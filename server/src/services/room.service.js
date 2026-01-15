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

	/**
	 * Search for group booking combinations
	 * Returns room combinations that can accommodate the group members
	 * @param {string} checkIn - Check-in date
	 * @param {string} checkOut - Check-out date
	 * @param {Array} members - Array of {id, quality, floor?}
	 * @param {Object} proximityByFloor - Object mapping floor names to boolean proximity requirements
	 * @param {string} [excludeSessionId] - Optional session ID to exclude from hold checks
	 * @returns {Promise<Object>} { primary: [], recommendations: [] }
	 */
	async searchGroupBooking(
		checkIn,
		checkOut,
		members,
		proximityByFloor = {},
		excludeSessionId = null
	) {
		if (!checkIn || !checkOut || !members || members.length === 0) {
			throw new Error(
				"Check-in, check-out dates, and members array are required"
			);
		}

		if (new Date(checkIn) >= new Date(checkOut)) {
			throw new Error("Check-out date must be after check-in date");
		}

		// Get available rooms for the date range (any floor)
		const availableRooms = await RoomRepository.findAvailableRooms(
			checkIn,
			checkOut,
			null,
			null,
			excludeSessionId
		);

		// Group by quality and floor for efficient lookup
		const roomsByQualityFloor = new Map();
		availableRooms.forEach((room) => {
			const key = `${room.quality}-${room.floor}`;
			if (!roomsByQualityFloor.has(key)) {
				roomsByQualityFloor.set(key, []);
			}
			roomsByQualityFloor.get(key).push(room);
		});

		// Group members by floor to handle proximity requirements
		const membersByFloor = new Map();
		members.forEach((member) => {
			if (member.floor) {
				if (!membersByFloor.has(member.floor)) {
					membersByFloor.set(member.floor, []);
				}
				membersByFloor.get(member.floor).push(member);
			}
		});

		const primary = [];
		const recommendations = [];
		const usedRoomIds = new Set();

		// Process each floor separately to handle proximity
		for (const [floor, floorMembers] of membersByFloor) {
			const needsProximity = proximityByFloor[floor] === true;

			if (needsProximity && floorMembers.length > 1) {
				// Need adjacent rooms on this floor
				const assigned = this._findAdjacentRooms(
					floorMembers,
					roomsByQualityFloor,
					floor,
					usedRoomIds
				);

				if (assigned.length === floorMembers.length) {
					// Successfully found adjacent rooms for all members on this floor
					for (const assignment of assigned) {
						primary.push({
							memberId: assignment.memberId,
							roomId: assignment.room._id,
							room: await this._populateOfferingData(assignment.room),
							floor: assignment.room.floor,
							quality: assignment.room.quality,
							isProximate: true,
						});
						usedRoomIds.add(assignment.room._id.toString());
					}
				} else {
					// Could not find enough adjacent rooms
					for (const member of floorMembers) {
						recommendations.push({
							memberId: member.id,
							quality: member.quality,
							preferredFloor: floor,
							status: "proximity-unavailable",
						});
					}
				}
			} else {
				// No proximity requirement or single guest on floor
				for (const member of floorMembers) {
					const key = `${member.quality}-${floor}`;
					const roomsForQuality = roomsByQualityFloor.get(key) || [];
					const availableInFloor = roomsForQuality.filter(
						(r) => !usedRoomIds.has(r._id.toString())
					);

					if (availableInFloor.length > 0) {
						const selectedRoom = availableInFloor[0];
						primary.push({
							memberId: member.id,
							roomId: selectedRoom._id,
							room: await this._populateOfferingData(selectedRoom),
							floor: selectedRoom.floor,
							quality: selectedRoom.quality,
							isProximate: false,
						});
						usedRoomIds.add(selectedRoom._id.toString());
					} else {
						recommendations.push({
							memberId: member.id,
							quality: member.quality,
							preferredFloor: floor,
							status: "unavailable",
						});
					}
				}
			}
		}

		return {
			primary,
			recommendations,
		};
	}

	/**
	 * Find adjacent rooms for group members on the same floor
	 * @param {Array} members - Array of members needing rooms
	 * @param {Map} roomsByQualityFloor - Map of rooms grouped by quality-floor
	 * @param {string} floor - The floor to search on
	 * @param {Set} usedRoomIds - Set of already-used room IDs
	 * @returns {Array} Array of {memberId, room} assignments, or empty if cannot satisfy
	 * @private
	 */
	_findAdjacentRooms(members, roomsByQualityFloor, floor, usedRoomIds) {
		// Extract pod number from podId (format: "FloorNumber + 2-digit sequence")
		const getPodNumber = (podId) => {
			const match = podId.match(/\d{2}$/);
			return match ? parseInt(match[0], 10) : null;
		};

		// Get all available rooms on this floor with required qualities
		const qualityGroups = new Map();
		members.forEach((member) => {
			if (!qualityGroups.has(member.quality)) {
				qualityGroups.set(member.quality, []);
			}
			qualityGroups.get(member.quality).push(member);
		});

		// Collect all available rooms for each quality on this floor
		const availableByQuality = new Map();
		for (const quality of qualityGroups.keys()) {
			const key = `${quality}-${floor}`;
			const rooms = roomsByQualityFloor.get(key) || [];
			const available = rooms
				.filter((r) => !usedRoomIds.has(r._id.toString()))
				.map((r) => ({
					room: r,
					podNumber: getPodNumber(r.podId),
				}))
				.filter((r) => r.podNumber !== null)
				.sort((a, b) => a.podNumber - b.podNumber);

			availableByQuality.set(quality, available);
		}

		// If only one quality, find consecutive rooms
		if (qualityGroups.size === 1) {
			const [quality, qualityMembers] = qualityGroups.entries().next().value;
			const available = availableByQuality.get(quality) || [];

			// Find a consecutive sequence of rooms
			for (let i = 0; i <= available.length - qualityMembers.length; i++) {
				let isConsecutive = true;
				for (let j = 0; j < qualityMembers.length - 1; j++) {
					if (
						available[i + j + 1].podNumber !==
						available[i + j].podNumber + 1
					) {
						isConsecutive = false;
						break;
					}
				}

				if (isConsecutive) {
					// Found consecutive rooms
					return qualityMembers.map((member, idx) => ({
						memberId: member.id,
						room: available[i + idx].room,
					}));
				}
			}
		} else {
			// Multiple qualities - cannot guarantee adjacency
			// Return empty to indicate proximity requirement cannot be met
			return [];
		}

		return []; // Could not find adjacent rooms
	}
}

export default new RoomService();
