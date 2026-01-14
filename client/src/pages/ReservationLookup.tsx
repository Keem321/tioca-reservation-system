import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import "./ReservationLookup.css";

/**
 * ReservationLookup Component
 * 
 * Allows guests without accounts to look up their reservations
 * using their email and confirmation code.
 */
const ReservationLookup: React.FC = () => {
	const navigate = useNavigate();
	const [confirmationCode, setConfirmationCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [emailOnlyMode, setEmailOnlyMode] = useState(false);
	
	// Email-only mode states
	const [email, setEmail] = useState("");
	const [verificationSent, setVerificationSent] = useState(false);
	const [showCodeInput, setShowCodeInput] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");

	/**
	 * Handle email-only lookup (sends verification without needing confirmation code)
	 */
	const handleEmailOnlyLookup = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URL || ""}/api/reservations/request-access-by-email`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: email.trim(),
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to send verification email");
			}

			setVerificationSent(true);
			setShowCodeInput(true);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to send verification email"
			);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Handle simple lookup by confirmation code only
	 */
	const handleSimpleLookup = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URL || ""}/api/reservations/lookup-by-code`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						confirmationCode: confirmationCode.trim().toUpperCase(),
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to find reservation");
			}

			// Navigate to guest reservation view with the reservation data
			navigate("/reservations/guest/view", {
				state: { reservation: data.reservation },
			});
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to find reservation"
			);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Handle verification code submission
	 */
	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URL || ""}/api/reservations/verify-code`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: email.trim(),
						code: verificationCode.trim(),
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Invalid verification code");
			}

			// Navigate to guest reservation view
			navigate("/reservations/guest/view", {
				state: { reservation: data.reservation },
			});
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Invalid verification code"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Navbar />
			<div className="reservation-lookup">
				<div className="reservation-lookup__container">
					<div className="reservation-lookup__header">
						<h1>Manage Your Reservation</h1>
						<p>
							{emailOnlyMode
								? "Enter your email to receive a verification code"
								: "Enter your confirmation code to view your reservation"}
						</p>
					</div>

					{error && (
						<div className="reservation-lookup__error">
							<span className="error-icon">⚠️</span>
							<span>{error}</span>
						</div>
					)}

					{verificationSent && !showCodeInput && (
						<div className="reservation-lookup__success">
							<span className="success-icon">✅</span>
							<div>
								<strong>Verification email sent!</strong>
								<p>
									Please check your email for a verification link or enter
									the code below.
								</p>
							</div>
						</div>
					)}

					{!verificationSent ? (
						<>
							{!emailOnlyMode ? (
								<form
									onSubmit={handleSimpleLookup}
									className="reservation-lookup__form"
								>
									<div className="form-group">
										<label htmlFor="confirmationCode">Confirmation Code</label>
										<input
											type="text"
											id="confirmationCode"
											value={confirmationCode}
											onChange={(e) =>
												setConfirmationCode(e.target.value.toUpperCase())
											}
											placeholder="TIOCA-XXXXXX"
											required
											disabled={loading}
											maxLength={12}
											autoFocus
										/>
										<small>
											Found in your confirmation email (e.g., TIOCA-ABC123)
										</small>
									</div>

									<div className="reservation-lookup__buttons">
										<button
											type="submit"
											className="btn btn-primary"
											disabled={loading}
										>
											{loading ? "Searching..." : "View Reservation"}
										</button>
									</div>

									<div className="reservation-lookup__divider">
										<span>OR</span>
									</div>

									<button
										type="button"
										onClick={() => setEmailOnlyMode(true)}
										className="btn btn-link"
									>
										Don't have your confirmation code? Use email only
									</button>
								</form>
							) : (
								<form
									onSubmit={handleEmailOnlyLookup}
									className="reservation-lookup__form"
								>
									<div className="form-group">
										<label htmlFor="email">Email Address</label>
										<input
											type="email"
											id="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="your-email@example.com"
											required
											disabled={loading}
										/>
										<small>
											We'll send a verification code to this email to confirm
											your identity
										</small>
									</div>

									<div className="reservation-lookup__buttons">
										<button
											type="submit"
											className="btn btn-primary"
											disabled={loading}
										>
											{loading ? "Sending..." : "Send Verification Code"}
										</button>

										<button
											type="button"
											onClick={() => setEmailOnlyMode(false)}
											className="btn btn-link"
										>
											Back to code lookup
										</button>
									</div>
								</form>
							)}
						</>
					) : (
						<form
							onSubmit={handleVerifyCode}
							className="reservation-lookup__form"
						>
							<div className="form-group">
								<label htmlFor="verificationCode">Verification Code</label>
								<input
									type="text"
									id="verificationCode"
									value={verificationCode}
									onChange={(e) => setVerificationCode(e.target.value)}
									placeholder="Enter 6-digit code"
									required
									disabled={loading}
									maxLength={6}
									pattern="[0-9]{6}"
								/>
								<small>Check your email for the 6-digit code</small>
							</div>

							<div className="reservation-lookup__buttons">
								<button
									type="submit"
									className="btn btn-primary"
									disabled={loading}
								>
									{loading ? "Verifying..." : "Verify & View"}
								</button>

								<button
									type="button"
									onClick={() => {
										setVerificationSent(false);
										setShowCodeInput(false);
										setVerificationCode("");
										setError("");
									}}
									className="btn btn-link"
								>
									Back to Lookup
								</button>
							</div>
						</form>
					)}

					<div className="reservation-lookup__help">
						<h3>Need Help?</h3>
						<ul>
							<li>
								Your confirmation code was sent to your email after booking
							</li>
							<li>
								Lost your confirmation email? Use the "email only" option above
							</li>
							<li>
								For assistance, contact us at{" "}
								<a href="mailto:support@tioca.com">support@tioca.com</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</>
	);
};

export default ReservationLookup;
