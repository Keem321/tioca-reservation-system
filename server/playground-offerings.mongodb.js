// MongoDB Playground file for TIOCA Reservation System - Offerings
// Creates room and amenity offerings for the pricing system
// Room offerings: Classic Pearl, Milk Pearl, Golden Pearl, Matcha Pearl, Crystal Boba Suite
// Amenity offerings: Breakfast, Late Checkout, Spa Credit, Airport Transfer, etc.
// Prices are stored in cents (USD)

use("tioca-reservation-system");

// Optional: clear existing offerings to allow repeatable runs
// Comment this out if you want to keep existing data
db.offerings.deleteMany({});

// Room quality offerings based on landing page pricing
const ROOM_OFFERINGS = [
	{
		name: "Classic Pearl",
		type: "room",
		quality: "classic",
		basePrice: 6500, // $65 per night in cents
		priceType: "per-night",
		description: "Essential comfort for the efficient traveler",
		features: [
			'80"L × 40"W × 40"H',
			"Private single capsule",
			"Essential amenities",
			"Perfect for short stays",
		],
		imageUrl: "/images/capsules/classic-pearl.jpg",
		capacity: "1 guest",
		isActive: true,
	},
	{
		name: "Milk Pearl",
		type: "room",
		quality: "milk",
		basePrice: 7500, // $75 per night in cents
		priceType: "per-night",
		description: "Enhanced space with premium comfort",
		features: [
			'84"L × 42"W × 45"H',
			"Extra workspace surface",
			"Premium bedding",
			"Enhanced privacy",
		],
		imageUrl: "/images/capsules/milk-pearl.jpg",
		capacity: "1 guest",
		isActive: true,
	},
	{
		name: "Golden Pearl",
		type: "room",
		quality: "golden",
		basePrice: 9500, // $95 per night in cents
		priceType: "per-night",
		description: "Spacious premium capsule experience",
		features: [
			'86"L × 45"W × 50"H',
			"Upright seating space",
			"Private storage",
			"Premium amenities",
		],
		imageUrl: "/images/capsules/golden-pearl.jpg",
		capacity: "1 guest",
		isActive: true,
	},
	{
		name: "Matcha Pearl",
		type: "room",
		quality: "matcha",
		basePrice: 9500, // $95 per night in cents
		priceType: "per-night",
		description: "Exclusive women-only premium capsule",
		features: [
			'86"L × 45"W × 50"H',
			"Women-only floor",
			"Enhanced privacy features",
			"Spacious layout",
		],
		imageUrl: "/images/capsules/matcha-pearl.jpg",
		capacity: "1 guest",
		tag: "Women Only",
		applicableFloors: ["women-only"],
		isActive: true,
	},
	{
		name: "Crystal Boba Suite",
		type: "room",
		quality: "crystal",
		basePrice: 15500, // $155 per night in cents
		priceType: "per-night",
		description: "First-class private suite experience",
		features: [
			'90"L × 55"W × 65"H',
			"Standing room height",
			"Private work desk",
			"Premium everything",
		],
		imageUrl: "/images/capsules/crystal-boba.jpg",
		capacity: "1-2 guests",
		tag: "First Class",
		isActive: true,
	},
];

// Optional amenity offerings
const AMENITY_OFFERINGS = [
	{
		name: "Breakfast Package",
		type: "amenity",
		basePrice: 1500, // $15 per night in cents
		priceType: "per-night",
		description: "Complimentary breakfast each morning",
		applicableQualities: [], // Available for all room types
		isActive: true,
	},
	{
		name: "Late Checkout",
		type: "amenity",
		basePrice: 2000, // $20 flat fee in cents
		priceType: "flat",
		description: "Checkout until 2 PM instead of 11 AM",
		applicableQualities: [], // Available for all room types
		isActive: true,
	},
	{
		name: "Spa Credit",
		type: "amenity",
		basePrice: 5000, // $50 flat fee in cents
		priceType: "flat",
		description: "$50 credit toward spa services",
		applicableQualities: ["golden", "crystal", "matcha"], // Premium rooms only
		isActive: true,
	},
	{
		name: "Airport Transfer",
		type: "amenity",
		basePrice: 3000, // $30 flat fee in cents
		priceType: "flat",
		description: "Round-trip airport transfer",
		applicableQualities: [],
		isActive: true,
	},
	{
		name: "Room Upgrade Credit",
		type: "amenity",
		basePrice: 2500, // $25 per night in cents
		priceType: "per-night",
		description: "Nightly credit toward room upgrades",
		applicableQualities: ["classic", "milk"],
		isActive: true,
	},
	{
		name: "Premium Toiletries",
		type: "amenity",
		basePrice: 500, // $5 per night in cents
		priceType: "per-night",
		description: "Luxury brand toiletries for all rooms",
		applicableQualities: [],
		isActive: true,
	},
];

// Combine all offerings and insert in one operation
const ALL_OFFERINGS = [...ROOM_OFFERINGS, ...AMENITY_OFFERINGS];

// Insert all offerings
const result = db.offerings.insertMany(ALL_OFFERINGS, { ordered: false });
print(`Inserted ${Object.keys(result.insertedIds).length} total offerings`);

// Display summary
print("\n=== Offering Summary ===");
print("Room Offerings:");
db.offerings.find({ type: "room" }).forEach((offering) => {
	print(
		`  - ${offering.name}: $${(offering.basePrice / 100).toFixed(2)}/night`
	);
});

print("\nAmenity Offerings:");
db.offerings.find({ type: "amenity" }).forEach((offering) => {
	const price = (offering.basePrice / 100).toFixed(2);
	const type = offering.priceType === "per-night" ? "/night" : "flat";
	print(`  - ${offering.name}: $${price} ${type}`);
});

print("\nSeeding completed successfully!");
