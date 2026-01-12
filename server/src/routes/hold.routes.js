import { Router } from "express";
import * as HoldController from "../controllers/roomHold.controller.js";

const router = Router();

/**
 * Room Hold Routes
 * 
 * These routes handle temporary room holds during the booking process
 * to prevent overbooking.
 */

// Create a new hold
router.post("/", HoldController.createHold);

// Get active holds for current session
router.get("/session", HoldController.getSessionHolds);

// Validate a hold
router.get("/:id/validate", HoldController.validateHold);

// Extend an existing hold (e.g., when moving to payment page)
router.patch("/:id/extend", HoldController.extendHold);

// Release a hold
router.delete("/:id", HoldController.releaseHold);

// Manual cleanup endpoint (could be restricted to managers)
router.post("/cleanup", HoldController.cleanupExpiredHolds);

export default router;
