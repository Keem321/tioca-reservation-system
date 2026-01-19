import mongoose from "mongoose";

/**
 * Analytics Event Schema
 * Tracks anonymous user behavior through the booking funnel
 * 
 * Stages:
 * - search: User is on booking/search page
 * - confirm: User is on booking confirmation page
 * - payment: User is on payment page
 * - success: User completed payment
 * 
 * Events:
 * - enter: User enters a stage
 * - exit: User leaves a stage (navigates away, closes tab, etc)
 * - complete: User completes a stage (moves to next)
 */
const analyticsEventSchema = new mongoose.Schema(
	{
		// Anonymous session identifier
		sessionId: {
			type: String,
			required: true,
			index: true,
		},
		// Booking stage: search, confirm, payment, success
		stage: {
			type: String,
			required: true,
			enum: ["search", "confirm", "payment", "success"],
			index: true,
		},
		// Event type: enter, exit, complete
		event: {
			type: String,
			required: true,
			enum: ["enter", "exit", "complete"],
		},
		// Additional metadata (optional)
		metadata: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		// IP address (for basic anonymized tracking)
		ipAddress: {
			type: String,
		},
		// User agent (browser info)
		userAgent: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

// Compound index for efficient queries
analyticsEventSchema.index({ sessionId: 1, stage: 1, event: 1 });
analyticsEventSchema.index({ createdAt: -1 });

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

export default AnalyticsEvent;
