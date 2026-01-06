import { Router } from "express";
const roomRouter = Router();
import {
	getRooms,
	getRoomsByHotel,
	getRoomById,
	createRoom,
	updateRoom,
	deleteRoom,
	updateRoomStatus,
	getAvailableRooms,
} from "../controllers/room.controller.js";

// Get all rooms (with optional hotel filter)
roomRouter.get("/", getRooms);

// Get available rooms for a hotel and date range
roomRouter.get("/hotel/:hotelId/available", getAvailableRooms);

// Get rooms by hotel ID
roomRouter.get("/hotel/:hotelId", getRoomsByHotel);

// Get a single room by ID
roomRouter.get("/:id", getRoomById);

// Create a new room
roomRouter.post("/", createRoom);

// Update a room
roomRouter.put("/:id", updateRoom);

// Update room status
roomRouter.patch("/:id/status", updateRoomStatus);

// Delete a room
roomRouter.delete("/:id", deleteRoom);

export default roomRouter;
