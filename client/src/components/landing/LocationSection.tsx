import React from "react";
import { MapPin } from "lucide-react";
import "./LocationSection.css";

/**
 * LocationSection Component
 *
 * Displays information about the hotel's location.
 */
const LocationSection: React.FC = () => {
	return (
		<section id="location" className="location-section">
			<div className="location-section__container">
				<h2 className="location-section__title">Perfectly Positioned</h2>
				<div className="location-section__address">
					<MapPin size={20} />
					<span>Tokyo, Walking Distance to Everything</span>
				</div>
				<p className="location-section__description">
					Located in the vibrant heart of the city, Tapioca offers
					immediate access to public transportation, dining, and cultural
					attractions while maintaining a tranquil atmosphere for rest.
				</p>
				<button className="location-section__button">View Map</button>
			</div>
		</section>
	);
};

export default LocationSection;

