import { Router } from "express";
const reservationRouter = Router();
import {
	getReservations,
	getReservationsByHotel,
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

// Get all reservations (with optional hotel filter)
reservationRouter.get("/", getReservations);

// Get upcoming check-ins for a hotel
reservationRouter.get("/hotel/:hotelId/upcoming-checkins", getUpcomingCheckIns);

// Get current check-outs for a hotel
reservationRouter.get("/hotel/:hotelId/current-checkouts", getCurrentCheckOuts);

// Get reservations by hotel ID
reservationRouter.get("/hotel/:hotelId", getReservationsByHotel);

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
