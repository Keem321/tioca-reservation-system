import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../features/authSlice";
import type { AppDispatch } from "../store";
import "./Login.css";

const Login: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleBackHome = () => {
		navigate("/");
	};

	const handleGoogleLogin = () => {
		const apiUrl = import.meta.env.VITE_API_URL || "";
		window.location.href = `${apiUrl}/api/auth/google?redirect=/`;
	};

	const handleLocalLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setIsSubmitting(true);
		try {
			const apiUrl = import.meta.env.VITE_API_URL || "";
			const res = await fetch(`${apiUrl}/api/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data?.message || "Invalid credentials");
			}
			const data = await res.json();
			// Update Redux store with user info
			dispatch(setUser(data.user));
			setSuccess("Logged in successfully");
			setTimeout(() => navigate("/"), 600);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Login failed";
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="login-page">
			{/* Animated boba bubbles */}
			<div className="bubble-container">
				{[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
					<div key={index} className={`bubble bubble--${index}`} />
				))}
			</div>

			<div className="login-card">
				<button
					type="button"
					onClick={handleBackHome}
					className="login-back-button"
				>
					← Back to home
				</button>
				<h1 className="login-title">Welcome back</h1>
				<p className="login-subtitle">
					Sign in with Google as a guest, or use management credentials.
				</p>

				<div className="login-grid">
					<div className="login-panel login-panel--oauth">
						<h2>Guest (Google)</h2>
						<p>Use your Google account to book and view reservations.</p>
						<button
							onClick={handleGoogleLogin}
							className="btn btn-primary login-button"
						>
							Continue with Google
						</button>
					</div>

					<div className="login-panel">
						<h2>Management</h2>
						<p>Sign in with your management account.</p>
						<form onSubmit={handleLocalLogin} className="login-form">
							<label htmlFor="email">Email</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>

							<label htmlFor="password">Password</label>
							<input
								type="password"
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>

							<button
								type="submit"
								className="btn btn-confirm login-button"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Signing in..." : "Sign In"}
							</button>
						</form>

						{error && <div className="alert alert-error">{error}</div>}
						{success && <div className="alert alert-success">{success}</div>}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
