import ReservationService from "../services/reservation.service.js";

/**
 * Get all reservations with optional filtering
 * @route GET /api/reservations?status=pending&dateFrom=2026-01-01&dateTo=2026-01-31&guestEmail=guest@example.com&podId=A101
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getReservations(req, res) {
	try {
		const { status, dateFrom, dateTo, guestEmail, podId } = req.query;
		const filters = {};

		// Status filter
		if (status) {
			filters.status = status;
		}

		// Date range filters (check-in date)
		if (dateFrom || dateTo) {
			filters.checkInDate = {};
			if (dateFrom) {
				filters.checkInDate.$gte = new Date(`${dateFrom}T00:00:00`);
			}
			if (dateTo) {
				filters.checkInDate.$lte = new Date(`${dateTo}T23:59:59`);
			}
		}

		// Guest email filter (case-insensitive partial match)
		if (guestEmail) {
			filters.guestEmail = { $regex: guestEmail, $options: "i" };
		}

		// Pod ID filter (via roomId population)
		if (podId) {
			// Note: podId is a string field in Room, so we need to filter through populated data
			// This will be handled on client-side or we'd need a separate aggregation query
			// For now, we'll pass it through and the frontend can filter
			filters.podIdFilter = podId; // Marker for client-side filtering
		}

		const reservations = await ReservationService.getAllReservations(filters);
		res.json(reservations);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Get reservations by user ID
 * @route GET /api/reservations/user/:userId
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getReservationsByUser(req, res) {
	try {
		const reservations = await ReservationService.getReservationsByUserId(
			req.params.userId
		);
		res.json(reservations);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Get a reservation by ID
 * @route GET /api/reservations/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getReservationById(req, res) {
	try {
		const reservation = await ReservationService.getReservationById(
			req.params.id
		);
		if (!reservation) {
			return res.status(404).json({ error: "Reservation not found" });
		}
		res.json(reservation);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Create a new reservation
 * @route POST /api/reservations
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function createReservation(req, res) {
	try {
		// Include session ID from the request
		const reservationData = {
			...req.body,
			sessionId: req.sessionID,
		};

		console.log("[Reservation] Creating reservation with data:", {
			roomId: reservationData.roomId,
			holdId: reservationData.holdId,
			sessionId: reservationData.sessionId,
			checkInDate: reservationData.checkInDate,
			checkOutDate: reservationData.checkOutDate,
		});

		const reservation = await ReservationService.createReservation(
			reservationData
		);
		res.status(201).json(reservation);
	} catch (err) {
		console.error("[Reservation] Error creating reservation:", err.message);
		// Provide more specific status codes
		if (
			err.message.includes("not available") ||
			err.message.includes("being booked")
		) {
			return res.status(409).json({ error: err.message });
		}
		if (
			err.message.includes("expired") ||
			err.message.includes("no longer available")
		) {
			return res.status(410).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Update a reservation
 * @route PUT /api/reservations/:id (managers only)
 * @route PATCH /api/reservations/:id/modify (guests can modify their own)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function updateReservation(req, res) {
	try {
		// If not a manager, verify the user owns this reservation
		if (req.user.role !== "manager") {
			const reservation = await ReservationService.getReservationById(
				req.params.id
			);
			if (!reservation) {
				return res.status(404).json({ error: "Reservation not found" });
			}
			// Check if the logged-in user is the owner of the reservation
			const reservationUserId =
				typeof reservation.userId === "string"
					? reservation.userId
					: reservation.userId?._id;
			if (reservationUserId !== req.user._id.toString()) {
				return res.status(403).json({
					error: "You can only modify your own reservations",
				});
			}
			// Guests can only modify certain fields
			const allowedFields = [
				"checkInDate",
				"checkOutDate",
				"numberOfGuests",
				"specialRequests",
			];
			const updateData = {};
			allowedFields.forEach((field) => {
				if (req.body[field] !== undefined) {
					updateData[field] = req.body[field];
				}
			});
			const updated = await ReservationService.updateReservation(
				req.params.id,
				updateData
			);
			return res.json(updated);
		}

		// Manager can update any field
		const reservation = await ReservationService.updateReservation(
			req.params.id,
			req.body
		);
		res.json(reservation);
	} catch (err) {
		if (err.message === "Reservation not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Delete a reservation
 * @route DELETE /api/reservations/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function deleteReservation(req, res) {
	try {
		await ReservationService.deleteReservation(req.params.id);
		res.status(204).send();
	} catch (err) {
		if (err.message === "Reservation not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(500).json({ error: err.message });
	}
}

/**
 * Cancel a reservation
 * @route POST /api/reservations/:id/cancel
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function cancelReservation(req, res) {
	try {
		// Get the reservation first to verify ownership
		const reservation = await ReservationService.getReservationById(
			req.params.id
		);
		if (!reservation) {
			return res.status(404).json({ error: "Reservation not found" });
		}

		// If not a manager, verify the user owns this reservation
		if (req.user.role !== "manager") {
			const reservationUserId =
				typeof reservation.userId === "string"
					? reservation.userId
					: reservation.userId?._id;
			if (reservationUserId !== req.user._id.toString()) {
				return res.status(403).json({
					error: "You can only cancel your own reservations",
				});
			}
		}

		const { reason } = req.body;
		const cancelledReservation = await ReservationService.cancelReservation(
			req.params.id,
			reason
		);
		res.json(cancelledReservation);
	} catch (err) {
		if (err.message === "Reservation not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Check in a reservation
 * @route POST /api/reservations/:id/check-in
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function checkIn(req, res) {
	try {
		const reservation = await ReservationService.checkIn(req.params.id);
		res.json(reservation);
	} catch (err) {
		if (err.message === "Reservation not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Check out a reservation
 * @route POST /api/reservations/:id/check-out
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function checkOut(req, res) {
	try {
		const reservation = await ReservationService.checkOut(req.params.id);
		res.json(reservation);
	} catch (err) {
		if (err.message === "Reservation not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Get upcoming check-ins
 * @route GET /api/reservations/upcoming-checkins?days=7
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getUpcomingCheckIns(req, res) {
	try {
		const days = parseInt(req.query.days) || 7;
		const reservations = await ReservationService.getUpcomingCheckIns(days);
		res.json(reservations);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Get current check-outs
 * @route GET /api/reservations/current-checkouts
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getCurrentCheckOuts(req, res) {
	try {
		const reservations = await ReservationService.getCurrentCheckOuts();
		res.json(reservations);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Update reservation status
 * @route PATCH /api/reservations/:id/status
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function updateReservationStatus(req, res) {
	try {
		const { status } = req.body;
		if (!status) {
			return res.status(400).json({ error: "Status is required" });
		}
		const reservation = await ReservationService.updateReservationStatus(
			req.params.id,
			status
		);
		res.json(reservation);
	} catch (err) {
		if (err.message === "Reservation not found") {
			return res.status(404).json({ error: err.message });
		}
		res.status(400).json({ error: err.message });
	}
}

/**
 * Get available time slots for a room on a date
 * @route GET /api/reservations/:roomId/slots?date=YYYY-MM-DD
 */
export async function getAvailableSlots(req, res) {
	try {
		const { roomId } = req.params;
		const { date } = req.query;
		const slots = await ReservationService.getAvailableTimeSlots(roomId, date);
		res.json({ slots });
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}
