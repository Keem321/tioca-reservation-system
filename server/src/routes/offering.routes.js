/**
 * Offering Routes
 * Public routes for viewing offerings
 * Admin-only routes for managing offerings (CRUD operations)
 */

import express from "express";
import {
	getOfferings,
	getOfferingById,
	getRoomOfferings,
	getAmenityOfferings,
	createOffering,
	updateOffering,
	deleteOffering,
	toggleOfferingStatus,
} from "../controllers/offering.controller.js";
import { requireAuth, requireRole } from "../middleware/roleAuth.js";

const router = express.Router();

// Public routes - anyone can view offerings
router.get("/", getOfferings);
router.get("/room-offerings", getRoomOfferings);
router.get("/amenity-offerings", getAmenityOfferings);
router.get("/:id", getOfferingById);

// Admin-only routes - CRUD operations
router.post("/", requireAuth, requireRole("admin"), createOffering);
router.put("/:id", requireAuth, requireRole("admin"), updateOffering);
router.delete("/:id", requireAuth, requireRole("admin"), deleteOffering);
router.patch(
	"/:id/toggle-status",
	requireAuth,
	requireRole("admin"),
	toggleOfferingStatus
);

export default router;
