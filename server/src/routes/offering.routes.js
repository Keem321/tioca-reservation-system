/**
 * Offering Routes
 * Public routes for viewing offerings
 * Admin routes for managing offerings
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

const router = express.Router();

// Public routes
router.get("/", getOfferings);
router.get("/room-offerings", getRoomOfferings);
router.get("/amenity-offerings", getAmenityOfferings);
router.get("/:id", getOfferingById);

// Admin routes (would need roleAuth middleware)
// These should be protected by admin role check
router.post("/", createOffering);
router.put("/:id", updateOffering);
router.delete("/:id", deleteOffering);
router.patch("/:id/toggle-status", toggleOfferingStatus);

export default router;
