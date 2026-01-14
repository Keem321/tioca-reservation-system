import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { logout, keepAlive } from "../features/authSlice";
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
	const [isLoggedOut, setIsLoggedOut] = useState(false);

	// Use refs to avoid stale closures
	const inactivityTimerRef = useRef<number | null>(null);
	const warningTimerRef = useRef<number | null>(null);
	const countdownIntervalRef = useRef<number | null>(null);
	const lastActivityRef = useRef<number>(0);
	const warningStartTimeRef = useRef<number | null>(null);
	const isLoggedOutRef = useRef<boolean>(false);

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
		console.log("[SessionTimeout] Setting isLoggedOutRef.current = true");
		console.log("[SessionTimeout] Setting showWarning = true (keep modal visible)");
		console.log("[SessionTimeout] Setting isLoggedOut state = true");
		
		cleanupTimers();
		
		// Set logged out state (modal stays visible with "Logged Out" message)
		isLoggedOutRef.current = true; // Set ref immediately to prevent race conditions
		setShowWarning(true); // Keep modal visible
		setIsLoggedOut(true);
		
		console.log("[SessionTimeout] Dispatching logout action...");
		await dispatch(logout());
		console.log("[SessionTimeout] Logout complete - modal should stay visible!");
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
	const resetActivity = useCallback(async () => {
		const now = Date.now();

		// When called from "Stay Logged In" button, we want to reset immediately
		// So we check if warning is showing, and if so, skip throttle check
		const isWarningShowing = warningStartTimeRef.current !== null;

		// Throttle: only reset if at least 1 second has passed since last activity
		// UNLESS the warning is showing (button click should always work)
		if (!isWarningShowing && now - lastActivityRef.current < 1000) {
			return;
		}

		console.log(
			"[SessionTimeout] 🔄 Resetting activity" +
				(isWarningShowing ? " (Stay Logged In clicked)" : "")
		);
		lastActivityRef.current = now;
		cleanupTimers();
		setShowWarning(false);
		warningStartTimeRef.current = null;

		// Ping the server to refresh the session activity timestamp
		try {
			await dispatch(keepAlive()).unwrap();
			console.log("[SessionTimeout] ✅ Server session refreshed successfully");
		} catch (error) {
			console.error(
				"[SessionTimeout] ❌ Failed to refresh server session:",
				error
			);
			// If keepalive fails, user is probably already logged out - trigger logout
			handleLogout();
			return;
		}

		// Start new inactivity timer
		inactivityTimerRef.current = setTimeout(() => {
			startWarning();
		}, INACTIVITY_TIMEOUT);
	}, [cleanupTimers, startWarning, dispatch, handleLogout]);

	// Set up activity listeners (only when auth changes, not when showWarning changes)
	useEffect(() => {
		console.log("[SessionTimeout] ⚙️ Effect running - isAuthenticated:", isAuthenticated);
		console.log("[SessionTimeout] ⚙️ isLoggedOutRef.current:", isLoggedOutRef.current);
		
		if (!isAuthenticated) {
			// If we just logged out due to inactivity, keep the modal visible
			// Check the ref (synchronous) to avoid race conditions with state
			if (isLoggedOutRef.current) {
				console.log(
					"[SessionTimeout] ✅ User logged out due to inactivity - KEEPING MODAL VISIBLE"
				);
				return;
			}

			console.log(
				"[SessionTimeout] ❌ User not authenticated (manual logout or other reason) - cleaning up"
			);
			cleanupTimers();
			setShowWarning(false);
			setIsLoggedOut(false);
			isLoggedOutRef.current = false;
			return;
		}
		
		console.log("[SessionTimeout] User is authenticated - setting up activity tracking");
		// Reset logged out state when authenticated
		isLoggedOutRef.current = false;

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

			// IMPORTANT: Ignore activity while warning modal is visible
			// This prevents the modal from disappearing when user moves mouse to click "Stay Logged In"
			if (warningStartTimeRef.current !== null) {
				console.log(
					"[SessionTimeout] Activity detected but warning is showing - ignoring"
				);
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
			} catch {
				// Ignore localStorage errors
			}
		};

		// Broadcast when activity is detected during warning
		if (showWarning) {
			broadcastActivity();
		}
	}, [isAuthenticated, showWarning]);

	const effectiveShowWarning = isAuthenticated && showWarning;

	return {
		showWarning: effectiveShowWarning,
		remainingSeconds,
		resetActivity,
		isLoggedOut,
	};
};
