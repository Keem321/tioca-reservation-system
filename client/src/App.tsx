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
import Booking from "./pages/Booking";
import RoomManagement from "./pages/RoomManagement";
import ReservationManagement from "./pages/ReservationManagement";
import ProtectedRoute from "./components/ProtectedRoute";

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

	useEffect(() => {
		if (!hasChecked) {
			dispatch(checkAuth()).catch(() => {
				// ignore 401s; protected routes will redirect if still unauthenticated
			});
		}
	}, [dispatch, hasChecked]);

	return (
		<Router>
			<div className="App">
				<Routes>
					<Route path="/" element={<Landing />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/booking" element={<Booking />} />
					<Route path="/login" element={<Login />} />
					<Route path="/booking" element={<Booking />} />
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
				</Routes>
			</div>
		</Router>
	);
}

export default App;
