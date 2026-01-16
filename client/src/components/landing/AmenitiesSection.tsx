import React from "react";
import {
	Wifi,
	Wind,
	Lock,
	Lightbulb,
	BatteryCharging,
	Coffee,
	Droplets,
	BellOff,
} from "lucide-react";
import "./AmenitiesSection.css";

/**
 * AmenitiesSection Component
 *
 * Displays the amenities offered by the hotel.
 */
const AmenitiesSection: React.FC = () => {
	const amenities = [
		{ text: "High-speed WiFi", icon: Wifi },
		{ text: "Climate control", icon: Wind },
		{ text: "Personal storage", icon: Lock },
		{ text: "Reading lights", icon: Lightbulb },
		{ text: "USB charging ports", icon: BatteryCharging },
		{ text: "Shared lounges", icon: Coffee },
		{ text: "Premium showers", icon: Droplets },
		{ text: "Quiet hours enforced", icon: BellOff },
	];

	return (
		<section id="amenities" className="amenities-section">
			<div className="amenities-section__container">
				<h2 className="amenities-section__title">Thoughtfully Designed</h2>
				<p className="amenities-section__description">
					Every detail curated for your comfort and convenience
				</p>

				<div className="amenities-section__grid">
					{amenities.map((amenity, idx) => {
						const Icon = amenity.icon;
						return (
							<div key={idx} className="amenities-section__item">
								<div className="amenities-section__icon">
									<Icon size={24} />
								</div>
								<span className="amenities-section__text">{amenity.text}</span>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

export default AmenitiesSection;
