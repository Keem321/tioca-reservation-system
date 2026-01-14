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
	getAvailableSlots,
} from "../controllers/reservation.controller.js";
import {
	requestReservationAccess,
	requestReservationAccessByEmail,
	verifyToken,
	verifyCode,
	lookupReservation,
	lookupReservationByCode,
} from "../controllers/reservationVerification.controller.js";
import { cancelGuestReservation } from "../controllers/guestReservation.controller.js";
import { requireRole, requireAuth } from "../middleware/roleAuth.js";

// Guest reservation verification routes (public)
// Request access to reservation (sends verification email)
reservationRouter.post("/request-access", requestReservationAccess);

// Request access by email only (no confirmation code needed)
reservationRouter.post("/request-access-by-email", requestReservationAccessByEmail);

// Verify token from email link
reservationRouter.get("/verify/:token", verifyToken);

// Verify 6-digit code
reservationRouter.post("/verify-code", verifyCode);

// Simple lookup by confirmation code only
reservationRouter.post("/lookup-by-code", lookupReservationByCode);

// Simple lookup by confirmation code and email (legacy - kept for compatibility)
reservationRouter.post("/lookup", lookupReservation);

// Cancel guest reservation (public - no auth required)
reservationRouter.post("/guest/:id/cancel", cancelGuestReservation);

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

// Available time slots for a room on a specific date (public)
reservationRouter.get("/:roomId/slots", getAvailableSlots);

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

// Guest update their own reservation (authenticated users)
reservationRouter.patch("/:id/modify", requireAuth, updateReservation);

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
