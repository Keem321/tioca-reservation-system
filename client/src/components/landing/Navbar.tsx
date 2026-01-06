import React, { useState } from "react";
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

	return (
		<nav className="navbar">
			<div className="navbar__logo">Tapioca</div>

			<div className="navbar__links">
				<a href="#rooms" className="navbar__link">
					Rooms
				</a>
				<a href="#amenities" className="navbar__link">
					Amenities
				</a>
				<a href="#location" className="navbar__link">
					Location
				</a>

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

				<button
					className="navbar__book-button"
					onClick={() => {
						document
							.querySelector(".hero")
							?.scrollIntoView({ behavior: "smooth" });
					}}
				>
					Book Now
				</button>
			</div>
		</nav>
	);
};

export default Navbar;

