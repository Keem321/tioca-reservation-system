import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import "./Navbar.css";

/**
 * Navbar Component
 *
 * Main navigation bar for the landing page.
 * Includes logo, navigation links, account menu, and book now button.
 */
const Navbar: React.FC = () => {
	const [accountMenuOpen, setAccountMenuOpen] = useState(false);
	const location = useLocation();
	const isBookingPage = location.pathname === "/booking";

	return (
		<nav className="navbar">
			<Link to="/" className="navbar__logo">
				Tapioca
			</Link>

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
							<button className="navbar__dropdown-item">Sign In</button>
							<button className="navbar__dropdown-item">
								Check Reservation
							</button>
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

