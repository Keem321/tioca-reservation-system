import { Router } from "express";
const reservationRouter = Router();
import {
	getReservations,
	getReservationsByUser,
	getReservationById,
	createReservation,
	updateReservation,
	deleteReservation,
	cancelReservation,
	checkIn,
	checkOut,
	getUpcomingCheckIns,
	getCurrentCheckOuts,
	updateReservationStatus,
} from "../controllers/reservation.controller.js";
import { requireRole, requireAuth } from "../middleware/roleAuth.js";

// Get all reservations (manager only)
reservationRouter.get(
	"/",
	requireAuth,
	requireRole("manager"),
	getReservations
);

// Get upcoming check-ins (manager only)
reservationRouter.get(
	"/upcoming-checkins",
	requireAuth,
	requireRole("manager"),
	getUpcomingCheckIns
);

// Get current check-outs (manager only)
reservationRouter.get(
	"/current-checkouts",
	requireAuth,
	requireRole("manager"),
	getCurrentCheckOuts
);

// Get reservations by user ID (authenticated users can view their own)
reservationRouter.get("/user/:userId", requireAuth, getReservationsByUser);

// Get a single reservation by ID (authenticated users can view)
reservationRouter.get("/:id", requireAuth, getReservationById);

// Create a new reservation (public - no auth required)
reservationRouter.post("/", createReservation);

// Update a reservation (manager only)
reservationRouter.put(
	"/:id",
	requireAuth,
	requireRole("manager"),
	updateReservation
);

// Update reservation status (manager only)
reservationRouter.patch(
	"/:id/status",
	requireAuth,
	requireRole("manager"),
	updateReservationStatus
);

// Cancel a reservation (authenticated users)
reservationRouter.post("/:id/cancel", requireAuth, cancelReservation);

// Check in a reservation (manager only)
reservationRouter.post(
	"/:id/check-in",
	requireAuth,
	requireRole("manager"),
	checkIn
);

// Check out a reservation (manager only)
reservationRouter.post(
	"/:id/check-out",
	requireAuth,
	requireRole("manager"),
	checkOut
);

// Delete a reservation (manager only)
reservationRouter.delete(
	"/:id",
	requireAuth,
	requireRole("manager"),
	deleteReservation
);

export default reservationRouter;
