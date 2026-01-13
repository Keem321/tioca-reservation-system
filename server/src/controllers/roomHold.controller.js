import RoomHoldService from "../services/roomHold.service.js";

/**
 * Create a new room hold
 * @route POST /api/holds
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function createHold(req, res) {
	try {
		const { roomId, checkInDate, checkOutDate, stage } = req.body;
		const sessionId = req.sessionID;
		const userId = req.user?._id || req.user?.id;

		if (!sessionId) {
			console.error("[Hold] No session found in request");
			return res.status(400).json({ error: "No session found" });
		}

		console.log("[Hold] Creating hold:", {
			roomId,
			checkInDate,
			checkOutDate,
			sessionId,
			stage: stage || "confirmation",
		});

		const hold = await RoomHoldService.createHold({
			roomId,
			checkInDate,
			checkOutDate,
			sessionId,
			userId,
			stage: stage || "confirmation",
		});

		console.log("[Hold] Hold created successfully:", hold._id);
		res.status(201).json(hold);
	} catch (err) {
		console.error("[Hold] Error creating hold:", err.message);
		// More specific error status codes
		if (
			err.message.includes("already booked") ||
			err.message.includes("being booked")
		) {
			return res.status(409).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Extend an existing hold
 * @route PATCH /api/holds/:id/extend
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function extendHold(req, res) {
	try {
		const { id } = req.params;
		const { stage } = req.body;
		const sessionId = req.sessionID;

		if (!sessionId) {
			return res.status(400).json({ error: "No session found" });
		}

		const hold = await RoomHoldService.extendHold(id, sessionId, stage);
		res.json(hold);
	} catch (err) {
		if (err.message.includes("not found")) {
			return res.status(404).json({ error: err.message });
		}
		if (err.message.includes("Unauthorized")) {
			return res.status(403).json({ error: err.message });
		}
		if (err.message.includes("expired")) {
			return res.status(410).json({ error: err.message }); // 410 Gone
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Release a hold
 * @route DELETE /api/holds/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function releaseHold(req, res) {
	try {
		const { id } = req.params;
		const sessionId = req.sessionID;

		if (!sessionId) {
			return res.status(400).json({ error: "No session found" });
		}

		await RoomHoldService.releaseHold(id, sessionId);
		res.status(204).send();
	} catch (err) {
		if (err.message.includes("Unauthorized")) {
			return res.status(403).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Get active holds for current session
 * @route GET /api/holds/session
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getSessionHolds(req, res) {
	try {
		const sessionId = req.sessionID;

		if (!sessionId) {
			return res.status(400).json({ error: "No session found" });
		}

		const holds = await RoomHoldService.getSessionHolds(sessionId);
		res.json(holds);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Validate a hold
 * @route GET /api/holds/:id/validate
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function validateHold(req, res) {
	try {
		const { id } = req.params;
		const sessionId = req.sessionID;

		if (!sessionId) {
			return res.status(400).json({ error: "No session found" });
		}

		const isValid = await RoomHoldService.validateHold(id, sessionId);
		res.json({ valid: isValid });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Manual cleanup of expired holds (for testing/admin)
 * @route POST /api/holds/cleanup
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function cleanupExpiredHolds(req, res) {
	try {
		const result = await RoomHoldService.cleanupExpiredHolds();
		res.json({
			message: "Expired holds cleaned up successfully",
			deletedCount: result.deletedCount,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}
