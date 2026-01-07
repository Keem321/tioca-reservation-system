import { Router } from "express";
const roomRouter = Router();
import {
	getRooms,
	getRoomById,
	createRoom,
	updateRoom,
	deleteRoom,
	updateRoomStatus,
	getAvailableRooms,
} from "../controllers/room.controller.js";

// Get all rooms
roomRouter.get("/", getRooms);

// Get available rooms for a date range
roomRouter.get("/available", getAvailableRooms);

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
