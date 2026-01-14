import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import "./ReservationVerify.css";

/**
 * ReservationVerify Component
 * 
 * Handles verification of email magic links
 * Automatically verifies the token and redirects to reservation view
 */
const ReservationVerify: React.FC = () => {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const [status, setStatus] = useState<"verifying" | "success" | "error">(
		"verifying"
	);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token) {
			setStatus("error");
			setError("Invalid verification link");
			return;
		}

		// Verify the token
		const verifyToken = async () => {
			try {
				const response = await fetch(
					`${import.meta.env.VITE_API_URL || ""}/api/reservations/verify/${token}`
				);

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Verification failed");
				}

				setStatus("success");

				// Redirect to guest reservation view after 1 second
				setTimeout(() => {
					navigate("/reservations/guest/view", {
						state: { reservation: data.reservation },
						replace: true,
					});
				}, 1000);
			} catch (err) {
				setStatus("error");
				setError(
					err instanceof Error ? err.message : "Verification failed"
				);
			}
		};

		verifyToken();
	}, [token, navigate]);

	return (
		<>
			<Navbar />
			<div className="reservation-verify">
				<div className="reservation-verify__container">
					{status === "verifying" && (
						<div className="verification-status verifying">
							<div className="spinner"></div>
							<h2>Verifying your link...</h2>
							<p>Please wait while we verify your reservation access.</p>
						</div>
					)}

					{status === "success" && (
						<div className="verification-status success">
							<div className="success-icon">✅</div>
							<h2>Verification Successful!</h2>
							<p>Redirecting you to your reservation...</p>
						</div>
					)}

					{status === "error" && (
						<div className="verification-status error">
							<div className="error-icon">❌</div>
							<h2>Verification Failed</h2>
							<p className="error-message">{error}</p>
							<div className="error-actions">
								<p>This link may have expired or already been used.</p>
								<button
									onClick={() => navigate("/reservations/lookup")}
									className="btn btn-primary"
								>
									Request New Verification
								</button>
								<button
									onClick={() => navigate("/")}
									className="btn btn-secondary"
								>
									Back to Home
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default ReservationVerify;
