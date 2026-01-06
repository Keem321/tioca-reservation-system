import React from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import RoomsSection from "../components/landing/RoomsSection";
import AmenitiesSection from "../components/landing/AmenitiesSection";
import LocationSection from "../components/landing/LocationSection";
import Footer from "../components/landing/Footer";
import "./Landing.css";

/**
 * Landing Page Component
 *
 * Main landing page that combines all landing page sections.
 * Uses Redux for state management and RTK Query for data fetching.
 */
const Landing: React.FC = () => {
	return (
		<div className="landing">
			<Navbar />
			<Hero />
			<RoomsSection />
			<AmenitiesSection />
			<LocationSection />
			<Footer />
		</div>
	);
};

export default Landing;

