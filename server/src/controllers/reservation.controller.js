import ReservationService from "../services/reservation.service.js";

/**
 * Get all reservations
 * @route GET /api/reservations
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getReservations(req, res) {
	try {
		const reservations = await ReservationService.getAllReservations();
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
		const reservation = await ReservationService.createReservation(req.body);
		res.status(201).json(reservation);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

/**
 * Update a reservation
 * @route PUT /api/reservations/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function updateReservation(req, res) {
	try {
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
		const { reason } = req.body;
		const reservation = await ReservationService.cancelReservation(
			req.params.id,
			reason
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
