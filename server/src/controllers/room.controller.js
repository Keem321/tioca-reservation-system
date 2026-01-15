import RoomService from "../services/room.service.js";

/**
 * Get all rooms
 * @route GET /api/rooms
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getRooms(req, res) {
	try {
		const rooms = await RoomService.getAllRooms();
		res.json(rooms);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Get a room by ID
 * @route GET /api/rooms/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getRoomById(req, res) {
	try {
		const room = await RoomService.getRoomById(req.params.id);
		if (!room) {
			return res.status(404).json({ error: "Room not found" });
		}
		res.json(room);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Create a new room
 * @route POST /api/rooms
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function createRoom(req, res) {
	try {
		const room = await RoomService.createRoom(req.body);
		res.status(201).json(room);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

/**
 * Update a room
 * @route PUT /api/rooms/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function updateRoom(req, res) {
	try {
		const room = await RoomService.updateRoom(req.params.id, req.body);
		res.json(room);
	} catch (err) {
		if (err.message === "Room not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Delete a room
 * @route DELETE /api/rooms/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function deleteRoom(req, res) {
	try {
		await RoomService.deleteRoom(req.params.id);
		res.status(204).send();
	} catch (err) {
		if (err.message === "Room not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(500).json({ error: err.message });
	}
}

/**
 * Update room status
 * @route PATCH /api/rooms/:id/status
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function updateRoomStatus(req, res) {
	try {
		const { status } = req.body;
		if (!status) {
			return res.status(400).json({ error: "Status is required" });
		}
		const room = await RoomService.updateRoomStatus(req.params.id, status);
		res.json(room);
	} catch (err) {
		if (err.message === "Room not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Get available rooms for date range
 * @route GET /api/rooms/available?checkIn=xxx&checkOut=xxx
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getAvailableRooms(req, res) {
	try {
		const { checkIn, checkOut, floor, quality } = req.query;
		const sessionId = req.sessionID; // Exclude holds from current session

		if (!checkIn || !checkOut) {
			return res
				.status(400)
				.json({ error: "Check-in and check-out dates are required" });
		}

		const rooms = await RoomService.getAvailableRooms(
			checkIn,
			checkOut,
			floor,
			quality,
			sessionId
		);
		res.json(rooms);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

/**
 * Get recommended rooms with partial availability
 * @route GET /api/rooms/recommended?checkIn=xxx&checkOut=xxx
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getRecommendedRooms(req, res) {
	try {
		const { checkIn, checkOut, floor, quality } = req.query;
		const sessionId = req.sessionID; // Exclude holds from current session

		if (!checkIn || !checkOut) {
			return res
				.status(400)
				.json({ error: "Check-in and check-out dates are required" });
		}

		const rooms = await RoomService.getRecommendedRooms(
			checkIn,
			checkOut,
			floor,
			quality,
			sessionId
		);
		res.json(rooms);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

/**
 * Search for group booking combinations
 * @route POST /api/rooms/group-search
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function searchGroupBooking(req, res) {
	try {
		const { checkIn, checkOut, members, proximityByFloor } = req.body;
		const sessionId = req.sessionID; // Exclude holds from current session

		if (!checkIn || !checkOut || !members || !Array.isArray(members)) {
			return res.status(400).json({
				error: "Check-in, check-out dates, and members array are required",
			});
		}

		if (members.length === 0) {
			return res.status(400).json({
				error: "Members array cannot be empty",
			});
		}

		const result = await RoomService.searchGroupBooking(
			checkIn,
			checkOut,
			members,
			proximityByFloor || {},
			sessionId
		);
		res.json(result);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}
