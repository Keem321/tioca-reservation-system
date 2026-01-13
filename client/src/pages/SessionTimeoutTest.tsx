import React, { useState } from "react";
import SessionTimeoutWarning from "../components/SessionTimeoutWarning";

/**
 * Session Timeout Test Page
 *
 * This page allows you to manually test the session timeout warning modal
 * without waiting for the actual timeout to occur.
 *
 * Access at: /session-timeout-test
 */
const SessionTimeoutTest: React.FC = () => {
	const [showModal, setShowModal] = useState(false);
	const [countdown, setCountdown] = useState(10);

	const handleShowModal = () => {
		console.log("[Test] Showing modal manually");
		setShowModal(true);
		setCountdown(10);

		// Start countdown for demo
		const interval = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					setShowModal(false);
					return 10;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const handleStayLoggedIn = () => {
		console.log("[Test] Stay logged in clicked");
		setShowModal(false);
		setCountdown(10);
	};

	return (
		<div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
			<h1>Session Timeout Test Page</h1>

			<div
				style={{
					marginBottom: "2rem",
					padding: "1rem",
					background: "#f5f1e8",
					borderRadius: "8px",
				}}
			>
				<h2>Instructions:</h2>
				<ol>
					<li>Click the button below to manually trigger the warning modal</li>
					<li>The modal should appear with a countdown</li>
					<li>Click "Stay Logged In" to dismiss it</li>
					<li>Open browser console to see debug logs</li>
				</ol>
			</div>

			<button
				onClick={handleShowModal}
				style={{
					background: "linear-gradient(135deg, #d4a574 0%, #c8956a 100%)",
					color: "#f5f1e8",
					border: "none",
					borderRadius: "12px",
					padding: "1rem 2rem",
					fontSize: "1.125rem",
					fontWeight: "600",
					cursor: "pointer",
					marginBottom: "2rem",
				}}
			>
				Test Warning Modal
			</button>

			<div style={{ marginBottom: "2rem" }}>
				<h3>Current State:</h3>
				<ul>
					<li>
						Modal Visible: <strong>{showModal ? "YES ✅" : "NO ❌"}</strong>
					</li>
					<li>
						Countdown: <strong>{countdown} seconds</strong>
					</li>
				</ul>
			</div>

			<div
				style={{
					padding: "1rem",
					background: "#fff3cd",
					borderRadius: "8px",
					border: "1px solid #d4a574",
				}}
			>
				<strong>Note:</strong> This is a test page only. The actual session
				timeout uses the <code>useSessionTimeout</code> hook in App.tsx with
				real inactivity detection.
			</div>

			{/* Render the modal */}
			{showModal && (
				<SessionTimeoutWarning
					remainingSeconds={countdown}
					onStayLoggedIn={handleStayLoggedIn}
				/>
			)}
		</div>
	);
};

export default SessionTimeoutTest;
