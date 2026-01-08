import React from "react";
import { useNavigate } from "react-router-dom";
import "./RoomsSection.css";

/**
 * Capsule type showcase interface
 */
interface CapsuleType {
	id: string;
	name: string;
	priceRange: string;
	description: string;
	features: string[];
	image: string;
	capacity: string;
	tag?: string; // Optional tag like "Women Only" or "First Class"
}

/**
 * Static capsule type showcase data
 * This is for advertising/showcasing the types - NOT live room inventory
 */
const CAPSULE_TYPES: CapsuleType[] = [
	{
		id: "classic",
		name: "Classic Pearl",
		priceRange: "from $65/night",
		description: "Essential comfort for the efficient traveler",
		features: [
			"80\"L × 40\"W × 40\"H",
			"Private single capsule",
			"Essential amenities",
			"Perfect for short stays"
		],
		image: "/images/capsules/classic-pearl.jpg",
		capacity: "1 guest",
	},
	{
		id: "milk",
		name: "Milk Pearl",
		priceRange: "from $75/night",
		description: "Enhanced space with premium comfort",
		features: [
			"84\"L × 42\"W × 45\"H",
			"Extra workspace surface",
			"Premium bedding",
			"Enhanced privacy"
		],
		image: "/images/capsules/milk-pearl.jpg",
		capacity: "1 guest",
	},
	{
		id: "golden",
		name: "Golden Pearl",
		priceRange: "from $95/night",
		description: "Spacious premium capsule experience",
		features: [
			"86\"L × 45\"W × 50\"H",
			"Upright seating space",
			"Private storage",
			"Premium amenities"
		],
		image: "/images/capsules/golden-pearl.jpg",
		capacity: "1 guest",
	},
	{
		id: "matcha",
		name: "Matcha Pearl",
		priceRange: "from $95/night",
		description: "Exclusive women-only premium capsule",
		features: [
			"86\"L × 45\"W × 50\"H",
			"Women-only floor",
			"Enhanced privacy features",
			"Spacious layout"
		],
		image: "/images/capsules/matcha-pearl.jpg",
		capacity: "1 guest",
		tag: "Women Only",
	},
	{
		id: "twin",
		name: "Twin Pearl",
		priceRange: "from $110/night",
		description: "Shared comfort for couples & companions",
		features: [
			"Wide double layout",
			"Couples floor",
			"Designed for two",
			"Shared amenities"
		],
		image: "/images/capsules/twin-pearl.jpg",
		capacity: "2 guests",
		tag: "Couples",
	},
	{
		id: "crystal",
		name: "Crystal Boba Suite",
		priceRange: "from $155/night",
		description: "First-class private suite experience",
		features: [
			"90\"L × 55\"W × 65\"H",
			"Standing room height",
			"Private work desk",
			"Premium everything"
		],
		image: "/images/capsules/crystal-boba.jpg",
		capacity: "1-2 guests",
		tag: "First Class",
	},
];

/**
 * RoomsSection Component
 *
 * Displays capsule type showcase for advertising purposes.
 * This is NOT live room inventory - it's a static showcase of capsule types.
 */
const RoomsSection: React.FC = () => {
	const navigate = useNavigate();

	const handleBookNow = () => {
		navigate("/booking");
	};

	return (
		<section id="rooms" className="rooms-section">
			<div className="rooms-section__container">
				<h2 className="rooms-section__title">Our Capsules</h2>
				<p className="rooms-section__subtitle">
					Choose from our range of thoughtfully designed capsule accommodations
				</p>

				<div className="rooms-section__grid">
					{CAPSULE_TYPES.map((capsule) => (
						<div key={capsule.id} className="rooms-section__card">
							<div className="rooms-section__card-image-wrapper">
								<img
									src={capsule.image}
									alt={capsule.name}
									className="rooms-section__card-image"
									onError={(e) => {
										// Fallback if image doesn't exist
										e.currentTarget.style.display = 'none';
										const parent = e.currentTarget.parentElement;
										if (parent) {
											parent.classList.add('rooms-section__card-image-wrapper--placeholder');
											parent.innerHTML = `<div class="rooms-section__card-image-placeholder">${capsule.name[0]}</div>`;
										}
									}}
								/>
								{capsule.tag && (
									<span className="rooms-section__card-tag">
										{capsule.tag}
									</span>
								)}
							</div>
							<div className="rooms-section__card-content">
								<div className="rooms-section__card-header">
									<h3 className="rooms-section__card-title">
										{capsule.name}
									</h3>
									<span className="rooms-section__card-price">
										{capsule.priceRange}
									</span>
								</div>
								<p className="rooms-section__card-description">
									{capsule.description}
								</p>
								<ul className="rooms-section__card-features">
									{capsule.features.map((feature, index) => (
										<li key={index} className="rooms-section__card-feature">
											{feature}
										</li>
									))}
								</ul>
								<div className="rooms-section__card-capacity">
									<span className="rooms-section__capacity-icon">👤</span>
									<span className="rooms-section__capacity-text">
										{capsule.capacity}
									</span>
								</div>
								<button 
									className="rooms-section__card-button"
									onClick={handleBookNow}
								>
									Book Now
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default RoomsSection;

