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

// Get all reservations
reservationRouter.get("/", getReservations);

// Get upcoming check-ins
reservationRouter.get("/upcoming-checkins", getUpcomingCheckIns);

// Get current check-outs
reservationRouter.get("/current-checkouts", getCurrentCheckOuts);

// Get reservations by user ID
reservationRouter.get("/user/:userId", getReservationsByUser);

// Get a single reservation by ID
reservationRouter.get("/:id", getReservationById);

// Create a new reservation
reservationRouter.post("/", createReservation);

// Update a reservation
reservationRouter.put("/:id", updateReservation);

// Update reservation status
reservationRouter.patch("/:id/status", updateReservationStatus);

// Cancel a reservation
reservationRouter.post("/:id/cancel", cancelReservation);

// Check in a reservation
reservationRouter.post("/:id/check-in", checkIn);

// Check out a reservation
reservationRouter.post("/:id/check-out", checkOut);

// Delete a reservation
reservationRouter.delete("/:id", deleteReservation);

export default reservationRouter;
