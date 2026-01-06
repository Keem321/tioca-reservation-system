import React from "react";
import "./AmenitiesSection.css";

/**
 * AmenitiesSection Component
 *
 * Displays the amenities offered by the hotel.
 */
const AmenitiesSection: React.FC = () => {
	const amenities = [
		"High-speed WiFi",
		"Climate control",
		"Personal storage",
		"Reading lights",
		"USB charging ports",
		"Shared lounges",
		"Premium showers",
		"Quiet hours enforced",
	];

	return (
		<section id="amenities" className="amenities-section">
			<div className="amenities-section__container">
				<h2 className="amenities-section__title">Thoughtfully Designed</h2>
				<p className="amenities-section__description">
					Every detail curated for your comfort and convenience
				</p>

				<div className="amenities-section__grid">
					{amenities.map((amenity, idx) => (
						<div key={idx} className="amenities-section__item">
							<span className="amenities-section__text">{amenity}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default AmenitiesSection;

