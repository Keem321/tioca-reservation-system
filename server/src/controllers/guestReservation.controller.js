import ReservationService from "../services/reservation.service.js";

/**
 * Cancel a reservation for guests (no authentication required)
 * @route POST /api/reservations/guest/:id/cancel
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function cancelGuestReservation(req, res) {
	try {
		const { id } = req.params;
		const { reason, email } = req.body;

		// Get the reservation
		const reservation = await ReservationService.getReservationById(id);
		
		if (!reservation) {
			return res.status(404).json({ error: "Reservation not found" });
		}

		// Verify this is a guest reservation (no userId)
		if (reservation.userId) {
			return res.status(403).json({
				error: "This reservation is linked to an account. Please log in to cancel.",
			});
		}

		// Verify email matches (security check)
		if (email && reservation.guestEmail.toLowerCase() !== email.toLowerCase()) {
			return res.status(403).json({
				error: "Email does not match reservation",
			});
		}

		// Cancel the reservation
		const cancelledReservation = await ReservationService.cancelReservation(
			id,
			reason
		);

		res.json(cancelledReservation);
	} catch (err) {
		console.error("Error cancelling guest reservation:", err.message);
		res.status(500).json({ error: err.message });
	}
}
