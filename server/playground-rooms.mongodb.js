// MongoDB Playground file for TIOCA Reservation System - Test Rooms
// Creates 100 pods/rooms across 4 floors (25 per floor)
// Floor mapping assumption:
//   1 = women-only, 2 = men-only, 3 = couples, 4 = business
// Pod ID format: 3 digits, first digit is floor number (e.g., 101, 304)
// Quality mapping:
//   classic = Classic Pearl, milk = Milk Pearl, golden = Golden Pearl,
//   crystal = Crystal Boba Suite, matcha = Matcha Pearl (women-only only)
// Note: Twin rooms (couples floor) use Twin variant offerings with higher prices

use("tioca-reservation-system");

// Optional: clear existing rooms to allow repeatable runs
// Comment this out if you want to keep existing data
db.rooms.deleteMany({});

// Get offering IDs - map both single and twin variants
const offerings = db.offerings.find({ type: "room" }).toArray();
const offeringMap = {}; // Map: quality -> single offering ID
const twinOfferingMap = {}; // Map: quality -> twin offering ID

offerings.forEach((offering) => {
	if (offering.variant === "twin") {
		twinOfferingMap[offering.quality] = offering._id;
	} else {
		offeringMap[offering.quality] = offering._id;
	}
});

// Verify all required single offerings exist
const requiredQualities = ["classic", "milk", "golden", "crystal", "matcha"];
for (const quality of requiredQualities) {
	if (!offeringMap[quality]) {
		throw new Error(
			`Missing single offering for quality: ${quality}. Please run playground-offerings.mongodb.js first.`
		);
	}
}

// Verify all required twin offerings exist
const twinQualities = ["classic", "milk", "golden"];
for (const quality of twinQualities) {
	if (!twinOfferingMap[quality]) {
		throw new Error(
			`Missing twin offering for quality: ${quality}. Please run playground-offerings.mongodb.js first.`
		);
	}
}

function createRoomsForFloor({
	floorKey,
	floorDigit,
	distributions,
	isTwinFloor = false,
}) {
	const rooms = [];
	let seq = 1; // 1..25 per floor

	for (const dist of distributions) {
		const { quality, count, label } = dist; // label is purely for description text

		for (let i = 0; i < count; i++) {
			const podNumber = floorDigit * 100 + seq; // 101..125, 201..225, etc.
			const podId = String(podNumber);

			// Use twin offering for couples floor, otherwise use single offering
			const offeringId = isTwinFloor
				? twinOfferingMap[quality]
				: offeringMap[quality];

			rooms.push({
				podId,
				quality, // classic|milk|golden|crystal|matcha
				floor: floorKey, // women-only|men-only|couples|business
				offeringId, // Reference to offering with pricing (single or twin variant)
				description: `${label} on ${floorKey} floor`
					.replace("women-only", "Women-Only")
					.replace("men-only", "Men-Only")
					.replace("couples", "Couples")
					.replace("business", "Business"),
				amenities: [],
				images: [],
				status: "available",
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			seq += 1;
		}
	}

	if (seq !== 26) {
		throw new Error(`Expected 25 rooms for floor ${floorKey}, got ${seq - 1}`);
	}

	return rooms;
}

// Distributions per requirement (25 per floor)
// men-only: 12 Classic, 8 Milk, 5 Golden
const menRooms = createRoomsForFloor({
	floorKey: "men-only",
	floorDigit: 2,
	distributions: [
		{ quality: "classic", count: 12, label: "Classic Pearl" },
		{ quality: "milk", count: 8, label: "Milk Pearl" },
		{ quality: "golden", count: 5, label: "Golden Pearl" },
	],
});

// women-only: 10 Classic, 8 Milk, 5 Golden, 2 Matcha
const womenRooms = createRoomsForFloor({
	floorKey: "women-only",
	floorDigit: 1,
	distributions: [
		{ quality: "classic", count: 10, label: "Classic Pearl" },
		{ quality: "milk", count: 8, label: "Milk Pearl" },
		{ quality: "golden", count: 5, label: "Golden Pearl" },
		{ quality: "matcha", count: 2, label: "Matcha Pearl" }, // validation enforces women-only
	],
});

// business: 10 Classic, 8 Milk, 5 Golden, 2 Crystal
const businessRooms = createRoomsForFloor({
	floorKey: "business",
	floorDigit: 4,
	distributions: [
		{ quality: "classic", count: 10, label: "Classic Pearl" },
		{ quality: "milk", count: 8, label: "Milk Pearl" },
		{ quality: "golden", count: 5, label: "Golden Pearl" },
		{ quality: "crystal", count: 2, label: "Crystal Boba Suite" },
	],
});

// couples: 8 Twin Classic, 10 Twin Milk, 7 Twin Golden
// Note: These use twin variant offerings with isTwinFloor=true
const couplesRooms = createRoomsForFloor({
	floorKey: "couples",
	floorDigit: 3,
	isTwinFloor: true,
	distributions: [
		{ quality: "classic", count: 8, label: "Twin Classic Pearl" },
		{ quality: "milk", count: 10, label: "Twin Milk Pearl" },
		{ quality: "golden", count: 7, label: "Twin Golden Pearl" },
	],
});

const allRooms = [
	...womenRooms,
	...menRooms,
	...couplesRooms,
	...businessRooms,
];

// Sanity check: ensure we have exactly 100 rooms
if (allRooms.length !== 100) {
	throw new Error(`Expected 100 rooms total, got ${allRooms.length}`);
}

const insertResult = db.rooms.insertMany(allRooms);

({
	insertedCount: Object.keys(insertResult.insertedIds).length,
	firstFive: allRooms
		.slice(0, 5)
		.map((r) => ({ podId: r.podId, floor: r.floor, quality: r.quality })),
});
