import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/authSlice";
import type { RootState, AppDispatch } from "../../store";
import { isManagerOrAbove, type UserRole } from "../../utils/roleUtils";
import "./Navbar.css";
import RoleGuard from "../RoleGuard";

/**
 * Navbar Component
 *
 * Main navigation bar for the landing page.
 * Includes logo, navigation links, account menu, and book now button.
 * Shows manager dropdown for logged-in managers.
 */
const Navbar: React.FC = () => {
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const location = useLocation();
	const isBookingPage = location.pathname === "/booking";
	const [managerMenuOpen, setManagerMenuOpen] = useState(false);
	const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const accountMenuRef = useRef<HTMLDivElement>(null);
	const managerMenuRef = useRef<HTMLDivElement>(null);
	const aboutMenuRef = useRef<HTMLDivElement>(null);

	const user = useSelector((state: RootState) => state.auth.user);
	const isLoggedIn = user !== null;
	const isManagerOrAdmin = isManagerOrAbove(user?.role as UserRole);

	// Close dropdowns when clicking outside or mouse leaves
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				accountMenuRef.current &&
				!accountMenuRef.current.contains(event.target as Node)
			) {
				setAccountMenuOpen(false);
			}
			if (
				managerMenuRef.current &&
				!managerMenuRef.current.contains(event.target as Node)
			) {
				setManagerMenuOpen(false);
			}
			if (
				aboutMenuRef.current &&
				!aboutMenuRef.current.contains(event.target as Node)
			) {
				setAboutMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Handle mouse enter/leave for account menu
	const handleAccountMouseEnter = () => {
		setAccountMenuOpen(true);
	};

	const handleAccountMouseLeave = () => {
		setAccountMenuOpen(false);
	};

	// Handle mouse enter/leave for manager menu
	const handleManagerMouseEnter = () => {
		setManagerMenuOpen(true);
	};

	const handleManagerMouseLeave = () => {
		setManagerMenuOpen(false);
	};

	const handleAboutMouseEnter = () => {
		setAboutMenuOpen(true);
	};

	const handleAboutMouseLeave = () => {
		setAboutMenuOpen(false);
	};

	const handleSignOut = async () => {
		console.log("[Navbar] Signing out user...");
		// Dispatch logout and wait for completion
		try {
			await dispatch(logout()).unwrap();
			console.log("[Navbar] Logout successful");
		} catch (error) {
			console.error("[Navbar] Logout error (continuing anyway):", error);
		}
		// Close menu
		setAccountMenuOpen(false);
		// Small delay to ensure logout is processed before redirect
		// Use replace to prevent back button issues
		setTimeout(() => {
			navigate("/", { replace: true });
		}, 100);
	};

	return (
		<nav className="navbar">
			<Link to="/" className="navbar__logo">
				Tapioca
			</Link>

			{/* Mobile menu toggle */}
			<button
				className="navbar__mobile-toggle"
				onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
			</button>

			<div
				className={`navbar__links ${
					mobileMenuOpen ? "navbar__links--open" : ""
				}`}
			>
				{/* Primary navigation */}
				<>
					{/* Room showcase page */}
					<Link to="/rooms" className="navbar__link">
						Rooms
					</Link>
					{/* Keep amenities anchor on landing for now */}
					<Link
						to="/"
						className="navbar__link"
						state={{ scrollTo: "amenities" }}
					>
						Amenities
					</Link>
					{/* About menu with policy links */}
					<div
						className="navbar__manager"
						ref={aboutMenuRef}
						onMouseEnter={handleAboutMouseEnter}
						onMouseLeave={handleAboutMouseLeave}
					>
						<button
							onClick={() => setAboutMenuOpen(!aboutMenuOpen)}
							className="navbar__manager-button"
						>
							About
							<ChevronDown
								size={16}
								className={`navbar__chevron ${aboutMenuOpen ? "navbar__chevron--open" : ""}`}
							/>
						</button>
						{aboutMenuOpen && (
							<div className="navbar__dropdown">
								<button
									onClick={() => {
										navigate("/about");
										setAboutMenuOpen(false);
									}}
									className="navbar__dropdown-item"
								>
									About Us
								</button>
								<button
									onClick={() => {
										navigate("/privacy");
										setAboutMenuOpen(false);
									}}
									className="navbar__dropdown-item"
								>
									Privacy Policy
								</button>
								<button
									onClick={() => {
										navigate("/terms");
										setAboutMenuOpen(false);
									}}
									className="navbar__dropdown-item"
								>
									Terms & Conditions
								</button>
							</div>
						)}
					</div>
				</>

				{/* Management dropdown - show for managers and admins */}
				{isManagerOrAdmin && (
					<div
						className="navbar__manager"
						ref={managerMenuRef}
						onMouseEnter={handleManagerMouseEnter}
						onMouseLeave={handleManagerMouseLeave}
					>
						<button
							onClick={() => setManagerMenuOpen(!managerMenuOpen)}
							className="navbar__manager-button"
						>
							Management
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
								<RoleGuard requiredRoles="admin">
									<button
										onClick={() => {
											navigate("/manage/analytics");
											setManagerMenuOpen(false);
										}}
										className="navbar__dropdown-item"
									>
										Analytics
									</button>
								</RoleGuard>
							</div>
						)}
					</div>
				)}

				<div
					className="navbar__account"
					ref={accountMenuRef}
					onMouseEnter={handleAccountMouseEnter}
					onMouseLeave={handleAccountMouseLeave}
				>
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
