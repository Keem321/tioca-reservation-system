import RoomHoldService from "./roomHold.service.js";

/**
 * Background Cleanup Service for Expired Holds
 * 
 * This service runs periodically to clean up expired holds.
 * Note: MongoDB TTL index on holdExpiry field also handles automatic cleanup,
 * but this service provides additional manual cleanup and logging.
 */
class HoldCleanupService {
	constructor() {
		this.intervalId = null;
		this.isRunning = false;
		this.cleanupIntervalMs = 2 * 60 * 1000; // Run every 2 minutes
	}

	/**
	 * Start the cleanup service
	 */
	start() {
		if (this.isRunning) {
			console.log("Hold cleanup service is already running");
			return;
		}

		console.log("Starting hold cleanup service...");
		this.isRunning = true;

		// Run immediately on start
		this.runCleanup();

		// Then run periodically
		this.intervalId = setInterval(() => {
			this.runCleanup();
		}, this.cleanupIntervalMs);
	}

	/**
	 * Stop the cleanup service
	 */
	stop() {
		if (!this.isRunning) {
			console.log("Hold cleanup service is not running");
			return;
		}

		console.log("Stopping hold cleanup service...");
		
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}

		this.isRunning = false;
		console.log("Hold cleanup service stopped");
	}

	/**
	 * Run a single cleanup operation
	 */
	async runCleanup() {
		try {
			const result = await RoomHoldService.cleanupExpiredHolds();
			
			if (result.deletedCount > 0) {
				console.log(
					`[Hold Cleanup] Cleaned up ${result.deletedCount} expired hold(s) at ${new Date().toISOString()}`
				);
			}
		} catch (error) {
			console.error("[Hold Cleanup] Error during cleanup:", error.message);
		}
	}

	/**
	 * Get service status
	 */
	getStatus() {
		return {
			isRunning: this.isRunning,
			intervalMs: this.cleanupIntervalMs,
			nextRunIn: this.isRunning ? "Running periodically" : "Not running",
		};
	}
}

// Export a singleton instance
export default new HoldCleanupService();
