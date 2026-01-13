import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import type { AppDispatch } from "../store";

/**
 * Session Timeout Hook
 *
 * Tracks user inactivity and triggers a warning modal before logging out.
 *
 * Timeline:
 * - 10 minutes of inactivity → show warning modal
 * - 3 minutes warning countdown → if no activity, logout
 *
 * @param isAuthenticated - Whether the user is currently logged in
 * @returns Object with showWarning, remainingSeconds, and resetActivity
 */

const INACTIVITY_TIMEOUT = 30 * 1000; // 10 minutes in milliseconds
const WARNING_DURATION = 10 * 1000; // 3 minutes in milliseconds

// Activity events to monitor
const ACTIVITY_EVENTS = [
	"mousedown",
	"mousemove",
	"keypress",
	"scroll",
	"touchstart",
	"click",
] as const;

export const useSessionTimeout = (isAuthenticated: boolean) => {
	const dispatch = useDispatch<AppDispatch>();
	const [showWarning, setShowWarning] = useState(false);
	const [remainingSeconds, setRemainingSeconds] = useState(0);

	// Use refs to avoid stale closures
	const inactivityTimerRef = useRef<number | null>(null);
	const warningTimerRef = useRef<number | null>(null);
	const countdownIntervalRef = useRef<number | null>(null);
	const lastActivityRef = useRef<number>(0);
	const warningStartTimeRef = useRef<number | null>(null);

	// Cleanup all timers
	const cleanupTimers = useCallback(() => {
		if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
			inactivityTimerRef.current = null;
		}
		if (warningTimerRef.current) {
			clearTimeout(warningTimerRef.current);
			warningTimerRef.current = null;
		}
		if (countdownIntervalRef.current) {
			clearInterval(countdownIntervalRef.current);
			countdownIntervalRef.current = null;
		}
	}, []);

	// Handle logout when timer expires
	const handleLogout = useCallback(async () => {
		console.log("[SessionTimeout] 🚪 Logging out due to inactivity");
		cleanupTimers();
		setShowWarning(false);
		await dispatch(logout());
		// Navigation will be handled by ProtectedRoute when user state becomes null
	}, [dispatch, cleanupTimers]);

	// Start the warning phase
	const startWarning = useCallback(() => {
		console.log(
			"[SessionTimeout] ⚠️ Starting warning phase - user has been inactive"
		);
		setShowWarning(true);
		warningStartTimeRef.current = Date.now();
		setRemainingSeconds(WARNING_DURATION / 1000);

		// Update countdown every second
		countdownIntervalRef.current = setInterval(() => {
			if (warningStartTimeRef.current) {
				const elapsed = Date.now() - warningStartTimeRef.current;
				const remaining = Math.max(
					0,
					Math.ceil((WARNING_DURATION - elapsed) / 1000)
				);
				setRemainingSeconds(remaining);

				if (remaining === 0) {
					handleLogout();
				}
			}
		}, 1000);

		// Set final timeout for logout
		warningTimerRef.current = setTimeout(() => {
			handleLogout();
		}, WARNING_DURATION);
	}, [handleLogout]);

	// Reset activity and all timers
	const resetActivity = useCallback(() => {
		const now = Date.now();

		// Throttle: only reset if at least 1 second has passed since last activity
		if (now - lastActivityRef.current < 1000) {
			return;
		}

		console.log("[SessionTimeout] Activity detected, resetting timers");
		lastActivityRef.current = now;
		cleanupTimers();
		setShowWarning(false);
		warningStartTimeRef.current = null;

		// Start new inactivity timer
		inactivityTimerRef.current = setTimeout(() => {
			startWarning();
		}, INACTIVITY_TIMEOUT);
	}, [cleanupTimers, startWarning]);

	// Set up activity listeners (only when auth changes, not when showWarning changes)
	useEffect(() => {
		if (!isAuthenticated) {
			console.log(
				"[SessionTimeout] User not authenticated, cleaning up timers"
			);
			cleanupTimers();
			setShowWarning(false);
			return;
		}

		console.log("[SessionTimeout] Initializing session timeout tracking");
		// Initial timer setup
		const now = Date.now();
		lastActivityRef.current = now;

		// Start initial inactivity timer
		inactivityTimerRef.current = setTimeout(() => {
			startWarning();
		}, INACTIVITY_TIMEOUT);

		// Add activity event listeners
		const handleActivity = () => {
			const currentTime = Date.now();

			// Throttle: only process if at least 1 second has passed
			if (currentTime - lastActivityRef.current < 1000) {
				return;
			}

			console.log("[SessionTimeout] Activity detected, resetting timers");
			lastActivityRef.current = currentTime;

			// Clean up existing timers
			if (inactivityTimerRef.current) {
				clearTimeout(inactivityTimerRef.current);
			}
			if (warningTimerRef.current) {
				clearTimeout(warningTimerRef.current);
			}
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
			}

			// Reset warning state
			setShowWarning(false);
			warningStartTimeRef.current = null;

			// Start new inactivity timer
			inactivityTimerRef.current = setTimeout(() => {
				startWarning();
			}, INACTIVITY_TIMEOUT);
		};

		// Attach listeners
		ACTIVITY_EVENTS.forEach((event) => {
			document.addEventListener(event, handleActivity, { passive: true });
		});

		// Cleanup on unmount or when auth changes
		return () => {
			console.log("[SessionTimeout] Cleaning up listeners and timers");
			ACTIVITY_EVENTS.forEach((event) => {
				document.removeEventListener(event, handleActivity);
			});
			cleanupTimers();
		};
	}, [isAuthenticated, cleanupTimers, startWarning]);

	// Multi-tab synchronization via localStorage
	useEffect(() => {
		if (!isAuthenticated) return;

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "sessionActivity" && e.newValue) {
				// Activity detected in another tab - reset this tab's timer
				const activityTime = parseInt(e.newValue, 10);
				const now = Date.now();

				// Only reset if activity was within last 2 seconds (avoid old events)
				if (now - activityTime < 2000) {
					resetActivity();
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [isAuthenticated, resetActivity]);

	// Broadcast activity to other tabs
	useEffect(() => {
		if (!isAuthenticated || !showWarning) return;

		// When we reset activity, broadcast it to other tabs
		const broadcastActivity = () => {
			try {
				localStorage.setItem("sessionActivity", Date.now().toString());
			} catch (e) {
				// Ignore localStorage errors
			}
		};

		// Broadcast when activity is detected during warning
		if (showWarning) {
			broadcastActivity();
		}
	}, [isAuthenticated, showWarning]);

	return {
		showWarning,
		remainingSeconds,
		resetActivity,
	};
};
