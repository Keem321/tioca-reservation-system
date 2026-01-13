import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./features/authSlice";
import type { AppDispatch, RootState } from "./store";
import "./App.css";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import BookingConfirmation from "./pages/BookingConfirmation";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import RoomManagement from "./pages/RoomManagement";
import ReservationManagement from "./pages/ReservationManagement";
import PaymentsManagement from "./pages/PaymentsManagement";
import SessionTimeoutTest from "./pages/SessionTimeoutTest";
import ProtectedRoute from "./components/ProtectedRoute";
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";
import { useSessionTimeout } from "./utils/useSessionTimeout";

/**
 * App Component
 *
 * Main application component with routing setup.
 * Uses React Router for navigation between pages.
 * Protected routes require manager role for management pages.
 */
function App() {
	const dispatch = useDispatch<AppDispatch>();
	const hasChecked = useSelector((state: RootState) => state.auth.hasChecked);
	const user = useSelector((state: RootState) => state.auth.user);

	// Check authentication status on mount
	useEffect(() => {
		if (!hasChecked) {
			dispatch(checkAuth()).catch(() => {
				// ignore 401s; protected routes will redirect if still unauthenticated
			});
		}
	}, [dispatch, hasChecked]);

	// Session timeout hook - only active when user is authenticated
	const isAuthenticated = user !== null;
	const { showWarning, remainingSeconds, resetActivity } =
		useSessionTimeout(isAuthenticated);

	// Debug: Log when authentication status changes
	useEffect(() => {
		console.log(
			"[App] Authentication status:",
			isAuthenticated ? "LOGGED IN" : "LOGGED OUT"
		);
		if (isAuthenticated && user) {
			console.log("[App] User:", user.email, "Role:", user.role);
		}
	}, [isAuthenticated, user]);

	// Debug: Log when warning state changes
	useEffect(() => {
		console.log("[App] 🔔 showWarning changed to:", showWarning);
		if (showWarning) {
			console.log(
				"[App] ⚠️ WARNING MODAL SHOULD BE VISIBLE NOW with",
				remainingSeconds,
				"seconds remaining"
			);
		}
	}, [showWarning, remainingSeconds]);

	return (
		<Router>
			<div className="App">
				{/* Debug: Always show modal state in console */}
				{console.log(
					"[App Render] showWarning =",
					showWarning,
					"remainingSeconds =",
					remainingSeconds
				)}

				{/* Session timeout warning modal */}
				{showWarning && (
					<SessionTimeoutWarning
						remainingSeconds={remainingSeconds}
						onStayLoggedIn={resetActivity}
					/>
				)}

				<Routes>
					<Route path="/" element={<Landing />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/booking" element={<Booking />} />
					<Route path="/login" element={<Login />} />
					<Route path="/booking/confirm" element={<BookingConfirmation />} />
					<Route path="/payment" element={<Payment />} />
					<Route path="/payment/success" element={<PaymentSuccess />} />
					<Route
						path="/session-timeout-test"
						element={<SessionTimeoutTest />}
					/>
					<Route
						path="/profile"
						element={
							<ProtectedRoute>
								<Profile />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/manage/rooms"
						element={
							<ProtectedRoute requiredRole="manager">
								<RoomManagement />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/manage/reservations"
						element={
							<ProtectedRoute requiredRole="manager">
								<ReservationManagement />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/manage/payments"
						element={
							<ProtectedRoute requiredRole="manager">
								<PaymentsManagement />
							</ProtectedRoute>
						}
					/>
				</Routes>
			</div>
		</Router>
	);
}

export default App;
