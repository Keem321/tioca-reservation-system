import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/authSlice";
import type { RootState, AppDispatch } from "../../store";
import "./Navbar.css";

/**
 * Navbar Component
 *
 * Main navigation bar for the landing page.
 * Includes logo, navigation links, account menu, and book now button.
 * Shows manager dropdown for logged-in managers.
 */
const Navbar: React.FC = () => {
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const location = useLocation();
	const isBookingPage = location.pathname === "/booking";
	const [managerMenuOpen, setManagerMenuOpen] = useState(false);
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	const user = useSelector((state: RootState) => state.auth.user);
	const isLoggedIn = user !== null;
	const isManager = user?.role === "manager";

	const handleSignOut = async () => {
		await dispatch(logout());
		setAccountMenuOpen(false);
		navigate("/");
	};

	return (
		<nav className="navbar">
			<button
				type="button"
				onClick={() => navigate("/")}
				className="navbar__logo"
			>
				Tapioca
			</button>

			<div className="navbar__links">
				{!isBookingPage ? (
					<>
						<a href="#rooms" className="navbar__link">
							Rooms
						</a>
						<a href="#amenities" className="navbar__link">
							Amenities
						</a>
						<a href="#location" className="navbar__link">
							Location
						</a>
					</>
				) : (
					<>
						<Link to="/#rooms" className="navbar__link">
							Rooms
						</Link>
						<Link to="/#amenities" className="navbar__link">
							Amenities
						</Link>
						<Link to="/#location" className="navbar__link">
							Location
						</Link>
					</>
				)}

				{/* Manager dropdown - only show for logged-in managers */}
				{isManager && (
					<div className="navbar__manager">
						<button
							onClick={() => setManagerMenuOpen(!managerMenuOpen)}
							className="navbar__manager-button"
						>
							Manager
							<ChevronDown
								size={16}
								className={`navbar__chevron ${
									managerMenuOpen ? "navbar__chevron--open" : ""
								}`}
							/>
						</button>

						{managerMenuOpen && (
							<div className="navbar__dropdown">
								<button
									onClick={() => {
										navigate("/manage/rooms");
										setManagerMenuOpen(false);
									}}
									className="navbar__dropdown-item"
								>
									Room Management
								</button>
								<button
									onClick={() => {
										navigate("/manage/offerings");
										setManagerMenuOpen(false);
									}}
									className="navbar__dropdown-item"
								>
									Offering Management
								</button>
								<button
									onClick={() => {
										navigate("/manage/reservations");
										setManagerMenuOpen(false);
									}}
									className="navbar__dropdown-item"
								>
									Reservation Management
								</button>
								<button
									onClick={() => {
										navigate("/manage/payments");
										setManagerMenuOpen(false);
									}}
									className="navbar__dropdown-item"
								>
									Payments Management
								</button>
							</div>
						)}
					</div>
				)}

				<div className="navbar__account">
					<button
						onClick={() => setAccountMenuOpen(!accountMenuOpen)}
						className="navbar__account-button"
					>
						Account
						<ChevronDown
							size={16}
							className={`navbar__chevron ${
								accountMenuOpen ? "navbar__chevron--open" : ""
							}`}
						/>
					</button>

					{accountMenuOpen && (
						<div className="navbar__dropdown">
							{isLoggedIn ? (
								<>
									<button
										onClick={() => {
											navigate("/profile");
											setAccountMenuOpen(false);
										}}
										className="navbar__dropdown-item"
									>
										My Profile
									</button>
									<button
										onClick={handleSignOut}
										className="navbar__dropdown-item navbar__dropdown-item--danger"
									>
										Sign Out
									</button>
								</>
							) : (
								<button
									onClick={() => {
										navigate("/login");
										setAccountMenuOpen(false);
									}}
									className="navbar__dropdown-item"
								>
							Sign In
						</button>
					)}
				{!isLoggedIn && (
					<button
						onClick={() => {
							navigate("/reservations/lookup");
							setAccountMenuOpen(false);
						}}
						className="navbar__dropdown-item"
					>
						Check Reservation
					</button>
				)}
				</div>
					)}
				</div>

				{isBookingPage ? (
					<Link to="/" className="navbar__book-button">
						Home
					</Link>
				) : (
					<Link to="/booking" className="navbar__book-button">
						Book Now
					</Link>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
