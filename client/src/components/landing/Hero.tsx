import React from "react";
import BookingForm from "./BookingForm";
import "./Hero.css";

/**
 * Hero Section Component
 *
 * Main hero section of the landing page with title, description, and booking form.
 */
const Hero: React.FC = () => {
	return (
		<section className="hero">
			<h1 className="hero__title">Rest Redefined</h1>
			<p className="hero__description">
				Experience the perfect balance of privacy, comfort, and modern design
				in the heart of the city
			</p>

			<BookingForm />
		</section>
	);
};

export default Hero;

