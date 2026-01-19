import express from "express";
import {
	trackEvent,
	getAnalyticsSummary,
	getRecentEvents,
	getDailyTrends,
} from "../controllers/analytics.controller.js";
import {
	requireAuth,
	requireRole,
	requireAdmin,
} from "../middleware/roleAuth.js";

const router = express.Router();

/**
 * POST /api/analytics/track
 * Track an analytics event (public endpoint - no auth required)
 * Body: { sessionId, stage, event, metadata? }
 */
router.post("/track", trackEvent);

/**
 * GET /api/analytics/summary
 * Get analytics summary with bounce rates
 * Query params: startDate?, endDate?
 * Requires manager role
 */
router.get("/summary", requireAuth, requireAdmin(), getAnalyticsSummary);

/**
 * GET /api/analytics/events
 * Get recent analytics events (for debugging)
 * Query params: limit?
 * Requires manager role
 */
router.get("/events", requireAuth, requireAdmin(), getRecentEvents);

/**
 * GET /api/analytics/trends
 * Get daily analytics trends
 * Query params: startDate?, endDate?
 * Requires manager role
 */
router.get("/trends", requireAuth, requireAdmin(), getDailyTrends);

export default router;
