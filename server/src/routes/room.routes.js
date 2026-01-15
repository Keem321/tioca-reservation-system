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
	getRecommendedRooms,
	searchGroupBooking,
} from "../controllers/room.controller.js";
import { requireRole, requireAuth } from "../middleware/roleAuth.js";

// Get all rooms (public)
roomRouter.get("/", getRooms);

// Get available rooms for a date range (public)
roomRouter.get("/available", getAvailableRooms);

// Get recommended rooms (public)
roomRouter.get("/recommended", getRecommendedRooms);

// Search for group booking combinations (public)
roomRouter.post("/group-search", searchGroupBooking);

// Get a single room by ID (public)
roomRouter.get("/:id", getRoomById);

// Create a new room (manager only)
roomRouter.post("/", requireAuth, requireRole("manager"), createRoom);

// Update a room (manager only)
roomRouter.put("/:id", requireAuth, requireRole("manager"), updateRoom);

// Update room status (manager only)
roomRouter.patch(
	"/:id/status",
	requireAuth,
	requireRole("manager"),
	updateRoomStatus
);

// Delete a room (manager only)
roomRouter.delete("/:id", requireAuth, requireRole("manager"), deleteRoom);

export default roomRouter;
