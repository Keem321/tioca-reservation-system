import { useEffect, useRef, useCallback } from "react";

/**
 * Analytics Hook
 * Tracks anonymous user behavior through the booking funnel
 * 
 * Stages:
 * - search: User is on booking/search page
 * - confirm: User is on booking confirmation page
 * - payment: User is on payment page
 * - success: User completed payment
 */

// Simple UUID generator (v4)
const generateUUID = (): string => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

// Get or create a session ID for this browser session
const getSessionId = (): string => {
	// Use sessionStorage so it's unique per tab/session
	let sessionId = sessionStorage.getItem("analytics_session_id");
	if (!sessionId) {
		sessionId = generateUUID();
		sessionStorage.setItem("analytics_session_id", sessionId);
	}
	return sessionId;
};

// Track an analytics event
const trackEvent = async (
	stage: "search" | "confirm" | "payment" | "success",
	event: "enter" | "exit" | "complete",
	metadata?: Record<string, unknown>
) => {
	try {
		const sessionId = getSessionId();
		
		await fetch("/api/analytics/track", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sessionId,
				stage,
				event,
				metadata: metadata || {},
			}),
		});
	} catch (error) {
		// Silently fail - analytics shouldn't break the app
		console.debug("Analytics tracking error:", error);
	}
};

/**
 * Hook to track page entry/exit for a specific stage
 * @param stage - The booking stage (search, confirm, payment, success)
 * @param enabled - Whether tracking is enabled (default: true)
 */
export const useAnalyticsTracking = (
	stage: "search" | "confirm" | "payment" | "success",
	enabled: boolean = true
) => {
	const hasTrackedEnter = useRef(false);

	useEffect(() => {
		if (!enabled) return;

		// Track enter event on mount
		if (!hasTrackedEnter.current) {
			trackEvent(stage, "enter");
			hasTrackedEnter.current = true;
		}

		// Track exit event on unmount
		return () => {
			trackEvent(stage, "exit");
		};
	}, [stage, enabled]);

	// Function to manually track completion
	const trackComplete = useCallback(
		(metadata?: Record<string, unknown>) => {
			if (enabled) {
				trackEvent(stage, "complete", metadata);
			}
		},
		[stage, enabled]
	);

	return { trackComplete };
};
