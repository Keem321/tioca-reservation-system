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

// Admin-only routes - CRUD operations on rooms
// Create a new room (admin only)
roomRouter.post("/", requireAuth, requireRole("admin"), createRoom);

// Update a room (admin only)
roomRouter.put("/:id", requireAuth, requireRole("admin"), updateRoom);

// Update room status (admin only)
roomRouter.patch(
	"/:id/status",
	requireAuth,
	requireRole("admin"),
	updateRoomStatus
);

// Delete a room (admin only)
roomRouter.delete("/:id", requireAuth, requireRole("admin"), deleteRoom);

export default roomRouter;
