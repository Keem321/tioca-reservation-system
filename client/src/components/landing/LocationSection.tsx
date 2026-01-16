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
				<div className="location-section__content">
					<div className="location-section__info">
						<div className="location-section__address">
							<MapPin size={20} />
							<span>3-14-8 Kabukicho, Shinjuku-ku, Tokyo 160-0021</span>
						</div>
						<p className="location-section__description">
							Located in the vibrant heart of Shinjuku, Tapioca offers immediate
							access to public transportation, dining, and cultural attractions
							while maintaining a tranquil atmosphere for rest.
						</p>
						<div className="location-section__highlights">
							<div className="location-section__highlight">
								<span className="location-section__highlight-icon">🚇</span>
								<span className="location-section__highlight-text">
									3 min walk to Shinjuku Station
								</span>
							</div>
							<div className="location-section__highlight">
								<span className="location-section__highlight-icon">🍜</span>
								<span className="location-section__highlight-text">
									50+ restaurants within 5 min walk
								</span>
							</div>
							<div className="location-section__highlight">
								<span className="location-section__highlight-icon">🏪</span>
								<span className="location-section__highlight-text">
									24/7 convenience stores nearby
								</span>
							</div>
							<div className="location-section__highlight">
								<span className="location-section__highlight-icon">🗼</span>
								<span className="location-section__highlight-text">
									15 min to Tokyo Tower by train
								</span>
							</div>
						</div>
						<a
							href="https://www.google.com/maps/search/?api=1&query=Shinjuku+Tokyo"
							target="_blank"
							rel="noopener noreferrer"
							className="location-section__button"
						>
							Open in Google Maps
						</a>
					</div>
					<div className="location-section__map">
						<iframe
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.5277144583!2d139.7003892!3d35.694003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188cd0d6b1ba1f%3A0x1c32a1f665fa1e2e!2sKabukicho%2C%20Shinjuku%20City%2C%20Tokyo%20160-0021%2C%20Japan!5e0!3m2!1sen!2sus!4v1234567890"
							width="100%"
							height="100%"
							style={{ border: 0, borderRadius: "12px" }}
							allowFullScreen
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
							title="Tapioca Location Map"
						></iframe>
					</div>
				</div>
			</div>
		</section>
	);
};

export default LocationSection;
