import AnalyticsEvent from "../models/analytics.model.js";

/**
 * Track Analytics Event
 * Records anonymous user behavior through booking funnel
 */
export const trackEvent = async (req, res) => {
	try {
		const { sessionId, stage, event, metadata } = req.body;

		if (!sessionId || !stage || !event) {
			return res.status(400).json({
				error: "sessionId, stage, and event are required",
			});
		}

		const analyticsEvent = new AnalyticsEvent({
			sessionId,
			stage,
			event,
			metadata: metadata || {},
			ipAddress: req.ip || req.connection.remoteAddress,
			userAgent: req.get("user-agent"),
		});

		await analyticsEvent.save();

		res.status(201).json({
			success: true,
			message: "Event tracked successfully",
		});
	} catch (error) {
		console.error("Error tracking analytics event:", error);
		res.status(500).json({
			error: "Failed to track event",
		});
	}
};

/**
 * Get Analytics Summary
 * Returns bounce rates and funnel metrics
 */
export const getAnalyticsSummary = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;

		// Build date filter
		const dateFilter = {};
		if (startDate) {
			dateFilter.$gte = new Date(startDate);
		}
		if (endDate) {
			dateFilter.$lte = new Date(endDate);
		}

		const matchFilter =
			Object.keys(dateFilter).length > 0
				? { createdAt: dateFilter }
				: {};

		// Get all events within date range
		const events = await AnalyticsEvent.find(matchFilter).sort({
			createdAt: 1,
		});

		// Group events by session and stage
		const sessionData = {};

		events.forEach((event) => {
			const { sessionId, stage, event: eventType } = event;

			if (!sessionData[sessionId]) {
				sessionData[sessionId] = {
					stages: {},
					completedStages: [],
				};
			}

			if (!sessionData[sessionId].stages[stage]) {
				sessionData[sessionId].stages[stage] = {
					entered: false,
					exited: false,
					completed: false,
				};
			}

			if (eventType === "enter") {
				sessionData[sessionId].stages[stage].entered = true;
			} else if (eventType === "exit") {
				sessionData[sessionId].stages[stage].exited = true;
			} else if (eventType === "complete") {
				sessionData[sessionId].stages[stage].completed = true;
				sessionData[sessionId].completedStages.push(stage);
			}
		});

		// Calculate metrics for each stage
		const stages = ["search", "confirm", "payment"];
		const metrics = {};

		stages.forEach((stage) => {
			let entered = 0;
			let bounced = 0;
			let completed = 0;

			Object.values(sessionData).forEach((session) => {
				const stageData = session.stages[stage];
				if (stageData && stageData.entered) {
					entered++;

					// User bounced if they exited without completing
					if (stageData.exited && !stageData.completed) {
						bounced++;
					}

					// User completed if they moved to next stage
					if (stageData.completed) {
						completed++;
					}
				}
			});

			const bounceRate = entered > 0 ? (bounced / entered) * 100 : 0;
			const completionRate =
				entered > 0 ? (completed / entered) * 100 : 0;

			metrics[stage] = {
				entered,
				bounced,
				completed,
				bounceRate: Math.round(bounceRate * 100) / 100,
				completionRate: Math.round(completionRate * 100) / 100,
			};
		});

		// Calculate overall funnel metrics
		const totalSessions = Object.keys(sessionData).length;
		const completedPayment = Object.values(sessionData).filter(
			(session) => session.completedStages.includes("payment")
		).length;
		const overallConversionRate =
			totalSessions > 0
				? (completedPayment / totalSessions) * 100
				: 0;

		res.json({
			success: true,
			data: {
				metrics,
				overall: {
					totalSessions,
					completedPayment,
					conversionRate:
						Math.round(overallConversionRate * 100) / 100,
				},
				dateRange: {
					start: startDate || "all time",
					end: endDate || "present",
				},
			},
		});
	} catch (error) {
		console.error("Error fetching analytics summary:", error);
		res.status(500).json({
			error: "Failed to fetch analytics summary",
		});
	}
};

/**
 * Get Recent Events (for debugging)
 * Returns recent analytics events
 */
export const getRecentEvents = async (req, res) => {
	try {
		const { limit = 100 } = req.query;

		const events = await AnalyticsEvent.find()
			.sort({ createdAt: -1 })
			.limit(parseInt(limit));

		res.json({
			success: true,
			data: events,
		});
	} catch (error) {
		console.error("Error fetching recent events:", error);
		res.status(500).json({
			error: "Failed to fetch recent events",
		});
	}
};

/**
 * Get Daily Trends
 * Returns daily breakdown of analytics data
 */
export const getDailyTrends = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;

		// Build date filter
		const dateFilter = {};
		if (startDate) {
			dateFilter.$gte = new Date(startDate);
		} else {
			// Default to last 30 days
			dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		}
		if (endDate) {
			dateFilter.$lte = new Date(endDate);
		}

		const matchFilter =
			Object.keys(dateFilter).length > 0
				? { createdAt: dateFilter }
				: {};

		// Aggregate by day
		const dailyData = await AnalyticsEvent.aggregate([
			{ $match: matchFilter },
			{
				$group: {
					_id: {
						date: {
							$dateToString: {
								format: "%Y-%m-%d",
								date: "$createdAt",
							},
						},
						stage: "$stage",
						event: "$event",
					},
					count: { $sum: 1 },
				},
			},
			{
				$sort: { "_id.date": 1 },
			},
		]);

		// Format the data by date
		const formattedData = {};

		dailyData.forEach((item) => {
			const date = item._id.date;
			const stage = item._id.stage;
			const event = item._id.event;

			if (!formattedData[date]) {
				formattedData[date] = {
					search: { enter: 0, exit: 0, complete: 0 },
					confirm: { enter: 0, exit: 0, complete: 0 },
					payment: { enter: 0, exit: 0, complete: 0 },
				};
			}

			if (formattedData[date][stage]) {
				formattedData[date][stage][event] = item.count;
			}
		});

		res.json({
			success: true,
			data: formattedData,
		});
	} catch (error) {
		console.error("Error fetching daily trends:", error);
		res.status(500).json({
			error: "Failed to fetch daily trends",
		});
	}
};
