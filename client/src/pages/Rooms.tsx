import { useState } from "react";
import Navbar from "../components/landing/Navbar";
import { useFormatMoney } from "../hooks/useFormatMoney";
import "./Rooms.css";

type RoomQuality = "classic" | "milk" | "golden" | "matcha" | "crystal";

interface RoomOffering {
	name: string;
	quality: RoomQuality;
	basePrice: number;
	capacity: string;
	description: string;
	sellingPoints: string[];
	features: string[];
	imageUrl: string;
	tag?: string;
	variant?: string;
}

const ROOM_OFFERINGS: RoomOffering[] = [
	{
		name: "Classic Pearl",
		quality: "classic",
		basePrice: 6499,
		capacity: "1 guest",
		description:
			"Your efficient escape in the heart of the city. Perfect for solo travelers who value smart design and essential comfort without compromise.",
		sellingPoints: [
			"Budget-friendly comfort for the savvy traveler",
			"Streamlined design maximizes every inch",
			"Ideal for short stays and quick getaways",
			"All essentials within reach",
		],
		features: [
			'80"L × 40"W × 40"H capsule',
			"Private single capsule",
			"Essential amenities included",
			"Reading light & USB charging",
			"Personal climate control",
			"Secure storage locker",
		],
		imageUrl: "/images/capsules/classic-pearl.jpg",
	},
	{
		name: "Twin Classic Pearl",
		quality: "classic",
		basePrice: 8499,
		capacity: "2 guests",
		description:
			"Share the experience with someone special. Twin layout offers side-by-side comfort for couples and friends who travel together.",
		sellingPoints: [
			"Perfect for couples on a budget",
			"Stay close without sacrificing privacy",
			"Double the comfort, smart pricing",
			"Great for friends traveling together",
		],
		features: [
			'80"L × 80"W × 40"H twin layout',
			"Side-by-side capsule design",
			"Private two-person space",
			"Dual reading lights",
			"Shared climate control",
			"Double storage lockers",
		],
		imageUrl: "/images/capsules/classic-pearl.jpg",
		variant: "twin",
	},
	{
		name: "Milk Pearl",
		quality: "milk",
		basePrice: 7499,
		capacity: "1 guest",
		description:
			"Step up to enhanced comfort. With extra space and premium touches, Milk Pearl transforms your capsule stay into a restful retreat.",
		sellingPoints: [
			"Premium bedding for deeper sleep",
			"Extra workspace for digital nomads",
			"Enhanced privacy with upgraded design",
			"The sweet spot of comfort and value",
		],
		features: [
			'84"L × 42"W × 45"H spacious capsule',
			"Premium memory foam mattress",
			"Dedicated workspace surface",
			"Enhanced soundproofing",
			"Premium aromatherapy option",
			"Power outlet strip & USB-C",
		],
		imageUrl: "/images/capsules/milk-pearl.jpg",
	},
	{
		name: "Twin Milk Pearl",
		quality: "milk",
		basePrice: 9999,
		capacity: "2 guests",
		description:
			"Elevated comfort for two. Premium spacing and enhanced amenities make this the ideal choice for couples seeking quality together time.",
		sellingPoints: [
			"Premium comfort without breaking the bank",
			"Extra elbow room for two guests",
			"Enhanced amenities throughout",
			"Perfect for romantic getaways",
		],
		features: [
			'84"L × 84"W × 45"H premium twin',
			"Premium spacing for two",
			"Enhanced amenities for couples",
			"Dual workspaces",
			"Premium soundproofing",
			"Double power outlets",
		],
		imageUrl: "/images/capsules/milk-pearl.jpg",
		variant: "twin",
	},
	{
		name: "Golden Pearl",
		quality: "golden",
		basePrice: 9499,
		capacity: "1 guest",
		description:
			"Experience true capsule luxury. Golden Pearl offers upright seating space, premium storage, and first-class amenities in a thoughtfully designed pod.",
		sellingPoints: [
			"Sit upright comfortably - full height design",
			"Business traveler's dream workspace",
			"Premium amenities as standard",
			"Extra storage for longer stays",
		],
		features: [
			'86"L × 45"W × 50"H with upright seating',
			"Full sitting height clearance",
			"Private work desk area",
			"Premium noise cancellation",
			"Deluxe storage compartments",
			"High-speed WiFi booster",
		],
		imageUrl: "/images/capsules/golden-pearl.jpg",
	},
	{
		name: "Twin Golden Pearl",
		quality: "golden",
		basePrice: 12499,
		capacity: "2 guests",
		description:
			"Luxury redefined for couples. Spacious twin layout with upright seating and separate storage makes this the ultimate shared capsule experience.",
		sellingPoints: [
			"Upright sitting space for two",
			"Separate storage for each guest",
			"Premium amenities throughout",
			"The pinnacle of capsule comfort",
		],
		features: [
			'86"L × 90"W × 50"H luxury twin',
			"Twin upright seating areas",
			"Separate storage zones",
			"Premium climate zones",
			"Dual work desk surfaces",
			"High-end entertainment system",
		],
		imageUrl: "/images/capsules/golden-pearl.jpg",
		variant: "twin",
	},
	{
		name: "Matcha Pearl",
		quality: "matcha",
		basePrice: 9499,
		capacity: "1 guest",
		description:
			"Exclusive sanctuary for women. Enjoy Golden Pearl luxury on our dedicated women-only floor with enhanced privacy and security features.",
		sellingPoints: [
			"Women-only floor for peace of mind",
			"All Golden Pearl premium features",
			"Enhanced privacy & security",
			"Supportive community atmosphere",
		],
		features: [
			'86"L × 45"W × 50"H premium capsule',
			"Located on women-only floor",
			"Enhanced security features",
			"Premium privacy curtains",
			"Dedicated floor amenities",
			"Community lounge access",
		],
		imageUrl: "/images/capsules/matcha-pearl.jpg",
		tag: "Women Only",
	},
	{
		name: "Crystal Boba Suite",
		quality: "crystal",
		basePrice: 15499,
		capacity: "1-2 guests",
		description:
			"First-class capsule living. Standing room height, private work desk, and luxury amenities create an experience that rivals traditional hotel rooms.",
		sellingPoints: [
			"Stand up fully inside your pod",
			"Private executive workspace",
			"Five-star hotel amenities",
			"Perfect for extended stays",
		],
		features: [
			'90"L × 55"W × 65"H full suite',
			"Full standing height - 65 inches",
			"Private executive desk & chair",
			"Premium entertainment system",
			"Luxury bedding & amenities",
			"Mini-fridge & coffee station",
		],
		imageUrl: "/images/capsules/crystal-boba.jpg",
		tag: "First Class",
	},
];

export default function Rooms() {
	const [activeTab, setActiveTab] = useState<"single" | "twin">("single");
	const [currentIndex, setCurrentIndex] = useState(0);
	const { formatPricePerNight } = useFormatMoney();

	const singleRooms = ROOM_OFFERINGS.filter((r) => !r.variant);
	const twinRooms = ROOM_OFFERINGS.filter((r) => r.variant === "twin");

	const currentRooms = activeTab === "single" ? singleRooms : twinRooms;
	const currentRoom = currentRooms[currentIndex];

	const handlePrevious = () => {
		setCurrentIndex((prev) =>
			prev === 0 ? currentRooms.length - 1 : prev - 1
		);
	};

	const handleNext = () => {
		setCurrentIndex((prev) =>
			prev === currentRooms.length - 1 ? 0 : prev + 1
		);
	};

	const handleTabChange = (tab: "single" | "twin") => {
		setActiveTab(tab);
		setCurrentIndex(0); // Reset to first room when switching tabs
	};

	return (
		<>
			<Navbar />
			<div className="rooms-page">
				<div className="rooms-hero">
					<h1>Our Rooms</h1>
					<p>
						From essential comfort to first-class luxury, discover the perfect
						capsule for your stay
					</p>
				</div>

				{/* Tab Navigation */}
				<div className="rooms-tabs">
					<button
						className={`rooms-tab ${activeTab === "single" ? "active" : ""}`}
						onClick={() => handleTabChange("single")}
					>
						Single Capsules
					</button>
					<button
						className={`rooms-tab ${activeTab === "twin" ? "active" : ""}`}
						onClick={() => handleTabChange("twin")}
					>
						Twin Capsules
					</button>
				</div>

				{/* Pagination Controls */}
				<div className="rooms-pagination-controls">
					<button
						className="pagination-arrow"
						onClick={handlePrevious}
						aria-label="Previous room"
					>
						‹
					</button>
					<div className="pagination-info">
						{currentIndex + 1} of {currentRooms.length}
					</div>
					<button
						className="pagination-arrow"
						onClick={handleNext}
						aria-label="Next room"
					>
						›
					</button>
				</div>

				{/* Single Room Card */}
				<div className="rooms-grid">
					<div key={currentRoom.name} className="room-card-expanded">
						{currentRoom.tag && (
							<div className="room-tag">{currentRoom.tag}</div>
						)}

						<div className="room-image-container">
							<img
								src={currentRoom.imageUrl}
								alt={currentRoom.name}
								className="room-image"
							/>
						</div>

						<div className="room-details">
							<div className="room-header">
								<h2>{currentRoom.name}</h2>
								<div className="room-price">
									{formatPricePerNight(currentRoom.basePrice)}
								</div>
							</div>

							<div className="room-capacity">{currentRoom.capacity}</div>

							<p className="room-description">{currentRoom.description}</p>

							<div className="room-selling-points">
								<h3>Why Choose This Room?</h3>
								<ul>
									{currentRoom.sellingPoints.map((point, idx) => (
										<li key={idx}>{point}</li>
									))}
								</ul>
							</div>

							<div className="room-features">
								<h3>Features & Amenities</h3>
								<ul>
									{currentRoom.features.map((feature, idx) => (
										<li key={idx}>{feature}</li>
									))}
								</ul>
							</div>

							<a href="/booking" className="book-this-room-btn">
								Book This Room
							</a>
						</div>
					</div>
				</div>

				{/* Pagination Dots */}
				<div className="pagination-dots">
					{currentRooms.map((_, idx) => (
						<button
							key={idx}
							className={`pagination-dot ${idx === currentIndex ? "active" : ""}`}
							onClick={() => setCurrentIndex(idx)}
							aria-label={`Go to room ${idx + 1}`}
						/>
					))}
				</div>

				{/* Bottom CTA */}
				<div className="rooms-cta">
					<h2>Ready to Book?</h2>
					<p>Choose your dates and reserve your perfect capsule</p>
					<a href="/booking" className="cta-button">
						Start Booking
					</a>
				</div>
			</div>
		</>
	);
}
