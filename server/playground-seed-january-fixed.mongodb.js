// MongoDB Playground - TIOCA January 2026 Complete Test Dataset
// ================================================================
// Comprehensive seeder for full month (January 2026) of realistic data
// Wipes and recreates: offerings, rooms, users, reservations, payments
//
// Usage: Run this script in MongoDB Playground or mongosh
// Warning: Drops all data in tioca-reservation-system database!

use("tioca-reservation-system");

print("========================================");
print("TIOCA JANUARY 2026 DATASET SEEDER");
print("========================================\n");
print("⚠️  WARNING: This will DROP all data!\n");

// ============================================
// STEP 1: DROP ALL COLLECTIONS
// ============================================
print("STEP 1: Dropping all collections...");

try {
	db.offerings.drop();
} catch (e) {}
try {
	db.rooms.drop();
} catch (e) {}
try {
	db.users.drop();
} catch (e) {}
try {
	db.reservations.drop();
} catch (e) {}
try {
	db.payments.drop();
} catch (e) {}
try {
	db.holds.drop();
} catch (e) {}

print("✓ All collections dropped\n");

// ============================================
// STEP 2: SEED OFFERINGS
// ============================================
print("STEP 2: Seeding offerings...");

const ROOM_OFFERINGS = [
	{
		name: "Classic Pearl",
		type: "room",
		quality: "classic",
		basePrice: 6499,
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
		basePrice: 7499,
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
		basePrice: 9499,
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
		basePrice: 9499,
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
		basePrice: 15499,
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
	{
		name: "Twin Classic Pearl",
		type: "room",
		quality: "classic",
		basePrice: 8499,
		priceType: "per-night",
		description: "Two-guest comfort capsule with enhanced space",
		features: [
			'80"L × 80"W × 40"H',
			"Twin layout side-by-side",
			"Perfect for couples and friends",
			"Private two-person capsule",
		],
		imageUrl: "/images/capsules/classic-pearl.jpg",
		capacity: "2 guests",
		variant: "twin",
		applicableFloors: ["couples"],
		isActive: true,
	},
	{
		name: "Twin Milk Pearl",
		type: "room",
		quality: "milk",
		basePrice: 9999,
		priceType: "per-night",
		description: "Spacious two-guest premium capsule with extra comfort",
		features: [
			'84"L × 84"W × 45"H',
			"Twin layout with premium spacing",
			"Enhanced amenities for two",
			"Extra workspace surface",
		],
		imageUrl: "/images/capsules/milk-pearl.jpg",
		capacity: "2 guests",
		variant: "twin",
		applicableFloors: ["couples"],
		isActive: true,
	},
	{
		name: "Twin Golden Pearl",
		type: "room",
		quality: "golden",
		basePrice: 12499,
		priceType: "per-night",
		description: "Luxurious two-guest premium capsule with spacious layout",
		features: [
			'86"L × 90"W × 50"H',
			"Twin premium layout with upright seating",
			"Separate storage areas for two guests",
			"Premium amenities throughout",
		],
		imageUrl: "/images/capsules/golden-pearl.jpg",
		capacity: "2 guests",
		variant: "twin",
		applicableFloors: ["couples"],
		isActive: true,
	},
];

const AMENITY_OFFERINGS = [
	{
		name: "Breakfast Package",
		type: "amenity",
		basePrice: 1500,
		priceType: "per-night",
		description: "Complimentary breakfast each morning",
		applicableQualities: [],
		isActive: true,
	},
	{
		name: "Late Checkout",
		type: "amenity",
		basePrice: 2000,
		priceType: "flat",
		description: "Checkout until 2 PM instead of 11 AM",
		applicableQualities: [],
		isActive: true,
	},
	{
		name: "Spa Credit",
		type: "amenity",
		basePrice: 5000,
		priceType: "flat",
		description: "$50 credit toward spa services",
		applicableQualities: ["golden", "crystal", "matcha"],
		isActive: true,
	},
	{
		name: "Airport Transfer",
		type: "amenity",
		basePrice: 3000,
		priceType: "flat",
		description: "Round-trip airport transfer",
		applicableQualities: [],
		isActive: true,
	},
];

let offeringIds = {};
const offeringMap = {};
const twinOfferingMap = {};

try {
	const res = db.offerings.insertMany([
		...ROOM_OFFERINGS,
		...AMENITY_OFFERINGS,
	]);
	if (res.insertedIds) {
		offeringIds = res.insertedIds;
		print(`✓ Inserted ${Object.keys(offeringIds).length} offerings\n`);
	}
} catch (e) {
	print(`⚠️  Offerings insertion: ${e.message}`);
	const existing = db.offerings.find({}).toArray();
	if (existing.length > 0) {
		existing.forEach((o, idx) => {
			offeringIds[idx] = o._id;
		});
		print(`✓ Using ${existing.length} existing offerings\n`);
	} else {
		throw new Error("Failed to create or find offerings");
	}
}

// Build offering maps directly from insertMany result to avoid DocumentDB read-after-write issues
// DocumentDB has replica set replication lag - reads may not see writes immediately
const allOfferingsArray = [...ROOM_OFFERINGS, ...AMENITY_OFFERINGS];
const insertedOfferingIds = Object.values(offeringIds || {});
print(
	`Building offering maps from ${
		allOfferingsArray.length
	} inserted offerings (id keys: ${
		Object.keys(offeringIds || {}).length
	}, id values: ${insertedOfferingIds.length})...`
);

insertedOfferingIds.forEach((offeringId, idx) => {
	const offeringData = allOfferingsArray[idx];
	if (!offeringData || offeringData.type !== "room") return;

	const isTwin = offeringData.variant === "twin";
	const quality = offeringData.quality;

	if (isTwin) {
		twinOfferingMap[quality] = offeringId;
	} else {
		offeringMap[quality] = offeringId;
	}
});

const hasOfferingsMapped =
	Object.keys(offeringMap).length > 0 ||
	Object.keys(twinOfferingMap).length > 0;

if (!hasOfferingsMapped) {
	print(
		"⚠️  Could not map offerings from insertMany result; aborting seeding."
	);
	throw new Error("Failed to map offerings");
}

print(
	`✓ Offering lookup ready (single: ${Object.keys(offeringMap).length}, twin: ${
		Object.keys(twinOfferingMap).length
	})\n`
);

// ============================================
// STEP 3: SEED ROOMS (100 pods)
// ============================================
print("STEP 3: Seeding rooms (100 pods)...");

let allRooms = [];

// Women-only floor
for (let i = 0; i < 10; i++)
	allRooms.push({
		podId: String(100 + i + 1),
		quality: "classic",
		floor: "women-only",
		offeringId: offeringMap.classic,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 8; i++)
	allRooms.push({
		podId: String(100 + 10 + i + 1),
		quality: "milk",
		floor: "women-only",
		offeringId: offeringMap.milk,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 5; i++)
	allRooms.push({
		podId: String(100 + 18 + i + 1),
		quality: "golden",
		floor: "women-only",
		offeringId: offeringMap.golden,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 2; i++)
	allRooms.push({
		podId: String(100 + 23 + i + 1),
		quality: "matcha",
		floor: "women-only",
		offeringId: offeringMap.matcha,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

// Men-only floor
for (let i = 0; i < 12; i++)
	allRooms.push({
		podId: String(200 + i + 1),
		quality: "classic",
		floor: "men-only",
		offeringId: offeringMap.classic,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 8; i++)
	allRooms.push({
		podId: String(200 + 12 + i + 1),
		quality: "milk",
		floor: "men-only",
		offeringId: offeringMap.milk,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 5; i++)
	allRooms.push({
		podId: String(200 + 20 + i + 1),
		quality: "golden",
		floor: "men-only",
		offeringId: offeringMap.golden,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

// Couples floor (twin)
for (let i = 0; i < 8; i++)
	allRooms.push({
		podId: String(300 + i + 1),
		quality: "classic",
		floor: "couples",
		offeringId: twinOfferingMap.classic,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 10; i++)
	allRooms.push({
		podId: String(300 + 8 + i + 1),
		quality: "milk",
		floor: "couples",
		offeringId: twinOfferingMap.milk,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 7; i++)
	allRooms.push({
		podId: String(300 + 18 + i + 1),
		quality: "golden",
		floor: "couples",
		offeringId: twinOfferingMap.golden,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

// Business floor
for (let i = 0; i < 10; i++)
	allRooms.push({
		podId: String(400 + i + 1),
		quality: "classic",
		floor: "business",
		offeringId: offeringMap.classic,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 8; i++)
	allRooms.push({
		podId: String(400 + 10 + i + 1),
		quality: "milk",
		floor: "business",
		offeringId: offeringMap.milk,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 5; i++)
	allRooms.push({
		podId: String(400 + 18 + i + 1),
		quality: "golden",
		floor: "business",
		offeringId: offeringMap.golden,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
for (let i = 0; i < 2; i++)
	allRooms.push({
		podId: String(400 + 23 + i + 1),
		quality: "crystal",
		floor: "business",
		offeringId: offeringMap.crystal,
		amenities: [],
		images: [],
		status: "available",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

let roomIdMap = {};
try {
	const res = db.rooms.insertMany(allRooms);
	if (res.insertedIds) {
		Object.entries(res.insertedIds).forEach(([idx, id]) => {
			roomIdMap[parseInt(idx)] = id;
		});
		print(`✓ Inserted ${Object.keys(roomIdMap).length} rooms\n`);
	}
} catch (e) {
	print(`⚠️  Rooms insertion: ${e.message}`);
	const existing = db.rooms.find({}).toArray();
	if (existing.length > 0) {
		existing.forEach((r, idx) => {
			roomIdMap[idx] = r._id;
		});
		print(`✓ Using ${existing.length} existing rooms\n`);
	} else {
		throw new Error("Failed to create or find rooms");
	}
}

const roomsByFloorQuality = {};
Object.entries(roomIdMap).forEach(([idx, roomId]) => {
	const room = allRooms[parseInt(idx)];
	if (!room) return;
	const key = `${room.floor}-${room.quality}`;
	if (!roomsByFloorQuality[key]) roomsByFloorQuality[key] = [];
	roomsByFloorQuality[key].push({
		_id: roomId,
		podId: room.podId,
		floor: room.floor,
		quality: room.quality,
	});
});

if (Object.keys(roomsByFloorQuality).length === 0) {
	throw new Error("Failed to build room lookup table");
}

// ============================================
// STEP 4: SEED USERS
// ============================================
print("STEP 4: Seeding users...");

const users = [
	{
		provider: "local",
		name: "Admin",
		email: "admin@tioca.com",
		password: "$2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG",
		role: "admin",
		createdAt: new Date("2025-12-01T00:00:00Z"),
		lastLogin: new Date("2026-01-15T09:15:00Z"),
	},
	{
		provider: "local",
		name: "Manager",
		email: "manager@tioca.com",
		password: "$2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG",
		role: "manager",
		createdAt: new Date("2025-12-01T00:00:00Z"),
		lastLogin: new Date("2026-01-15T09:00:00Z"),
	},
	{
		provider: "google",
		providerId: "101038855044083445001",
		name: "Akeem Laurence",
		email: "keemkeem321@gmail.com",
		role: "user",
		createdAt: new Date("2025-11-15T10:30:00Z"),
		lastLogin: new Date("2026-01-14T18:22:00Z"),
	},
	{
		provider: "google",
		providerId: "118527482956738291847",
		name: "Sarah Chen",
		email: "sarah.chen@gmail.com",
		role: "user",
		createdAt: new Date("2025-12-20T14:15:00Z"),
		lastLogin: new Date("2026-01-12T11:45:00Z"),
	},
	{
		provider: "google",
		providerId: "106439247629781234567",
		name: "Michael Rodriguez",
		email: "michael.r@gmail.com",
		role: "user",
		createdAt: new Date("2026-01-02T08:00:00Z"),
		lastLogin: new Date("2026-01-10T16:30:00Z"),
	},
	{
		provider: "local",
		name: "Emily Wong",
		email: "emily.wong@example.com",
		password: "$2b$10$dummyhashedpasswordfortesting123456",
		role: "user",
		createdAt: new Date("2025-12-10T12:00:00Z"),
		lastLogin: new Date("2026-01-13T20:15:00Z"),
	},
	{
		provider: "local",
		name: "David Kim",
		email: "david.kim@example.com",
		password: "$2b$10$dummyhashedpasswordfortesting123456",
		role: "user",
		createdAt: new Date("2025-11-25T09:30:00Z"),
		lastLogin: new Date("2026-01-11T07:00:00Z"),
	},
	{
		provider: "guest",
		name: "Jessica Park",
		email: "jessica.park@guest.com",
		role: "user",
		createdAt: new Date("2026-01-03T15:20:00Z"),
		lastLogin: null,
	},
	{
		provider: "guest",
		name: "Robert Martinez",
		email: "robert.m@guest.com",
		role: "user",
		createdAt: new Date("2026-01-06T10:00:00Z"),
		lastLogin: null,
	},
];

let userIds = [];
try {
	const res = db.users.insertMany(users);
	if (res.insertedIds) {
		userIds = Object.values(res.insertedIds);
		print(`✓ Inserted ${userIds.length} users\n`);
	}
} catch (e) {
	print(`⚠️  Users insertion: ${e.message}`);
	const existing = db.users.find({}).toArray();
	if (existing.length > 0) {
		userIds = existing.map((u) => u._id);
		print(`✓ Using ${userIds.length} existing users\n`);
	} else {
		throw new Error("Failed to create or find users");
	}
}

// ============================================
// STEP 5: HELPER FUNCTIONS
// ============================================

function janDate(day, hour, minute) {
	return new Date(2026, 0, day, hour || 0, minute || 0, 0, 0);
}
function nightsBetween(checkIn, checkOut) {
	return Math.max(1, Math.round((checkOut - checkIn) / (24 * 60 * 60 * 1000)));
}
function calculatePrice(basePrice, nights) {
	return basePrice * nights;
}
function getRandomRoom(floorKey, qualityKey) {
	const key = `${floorKey}-${qualityKey}`;
	const rooms = roomsByFloorQuality[key];
	if (!rooms || rooms.length === 0)
		throw new Error(`No rooms found for ${key}`);
	return rooms[Math.floor(Math.random() * rooms.length)];
}
function getBasePrice(floor, quality) {
	const isTwin = floor === "couples";
	const offering = ROOM_OFFERINGS.find(
		(o) => o.quality === quality && (isTwin ? o.variant === "twin" : !o.variant)
	);
	return offering ? offering.basePrice : 6500;
}

// ============================================
// STEP 6: SEED RESERVATIONS & PAYMENTS
// ============================================
print("STEP 5: Seeding January reservations & payments...");

const reservations = [];
const payments = [];
let reservationCounter = 0;
let paymentCounter = 0;
const roomOccupancy = {};

function isRoomAvailable(roomId, checkIn, checkOut) {
	const occupancy = roomOccupancy[roomId] || [];
	for (const period of occupancy) {
		if (checkIn < period.checkOut && checkOut > period.checkIn) return false;
	}
	return true;
}

function bookRoom(roomId, checkIn, checkOut) {
	if (!roomOccupancy[roomId]) roomOccupancy[roomId] = [];
	roomOccupancy[roomId].push({ checkIn, checkOut });
}

function createReservationAndPayment({
	userId,
	guestName,
	guestEmail,
	guestPhone,
	floor,
	quality,
	checkIn,
	checkOut,
	numberOfGuests,
	status,
	paymentStatus,
	paymentAmount,
	specialRequests,
	paymentFailReason,
	refundAmount,
	createdOffset,
}) {
	let room = getRandomRoom(floor, quality);

	if (!isRoomAvailable(room._id, checkIn, checkOut)) {
		const key = `${floor}-${quality}`;
		const availableRooms = roomsByFloorQuality[key].filter((r) =>
			isRoomAvailable(r._id, checkIn, checkOut)
		);
		if (availableRooms.length === 0) {
			print(
				`⚠️  No available ${floor}-${quality} rooms for ${checkIn.toDateString()}`
			);
			return;
		}
		room = availableRooms[0];
	}

	bookRoom(room._id, checkIn, checkOut);

	const nights = nightsBetween(checkIn, checkOut);
	const basePrice = getBasePrice(floor, quality);
	const totalPrice = calculatePrice(basePrice, nights);
	const actualPaymentAmount =
		paymentAmount !== null ? paymentAmount : totalPrice;
	const createdAt = new Date(
		checkIn.getTime() - (createdOffset || 0) * 24 * 60 * 60 * 1000
	);
	const updatedAt = new Date(createdAt.getTime() + 3600000);

	const stripeCustomerId = `cus_jan_${String(reservationCounter).padStart(
		4,
		"0"
	)}`;
	const stripePaymentIntentId = `pi_jan_${String(paymentCounter).padStart(
		4,
		"0"
	)}`;
	const stripeChargeId =
		paymentStatus === "paid"
			? `ch_jan_${String(paymentCounter).padStart(4, "0")}`
			: null;

	reservations.push({
		roomId: room._id,
		userId: userId || null,
		guestName,
		guestEmail,
		guestPhone: guestPhone || "+81-90-0000-0000",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests,
		totalPrice,
		status,
		paymentStatus,
		stripeCustomerId,
		stripePaymentIntentId,
		stripeChargeId,
		specialRequests: specialRequests || "",
		createdAt,
		updatedAt,
	});

	const paymentStatusMap = {
		paid: "succeeded",
		unpaid: "pending",
		partial: "succeeded",
		failed: "failed",
		refunded: "succeeded",
	};

	payments.push({
		reservationId: null,
		userId: userId || null,
		amount: actualPaymentAmount,
		currency: "usd",
		status: paymentStatusMap[paymentStatus] || "pending",
		stripePaymentIntentId,
		stripeChargeId,
		stripeCustomerId,
		paymentMethod: "card",
		guestEmail,
		guestName,
		refundAmount: refundAmount || 0,
		refundReason: (refundAmount || 0) > 0 ? "Customer requested refund" : null,
		failureReason: paymentFailReason || null,
		metadata: {
			checkIn: checkIn.toISOString(),
			checkOut: checkOut.toISOString(),
			roomPodId: room.podId,
			nights,
		},
		createdAt,
		updatedAt,
	});

	reservationCounter++;
	paymentCounter++;
}

// ============================================
// JANUARY BOOKING SCENARIOS
// ============================================

createReservationAndPayment({
	userId: userIds[1],
	guestName: "Akeem Laurence",
	guestEmail: "keemkeem321@gmail.com",
	guestPhone: "+81-90-1234-5678",
	floor: "business",
	quality: "milk",
	checkIn: janDate(2, 15, 0),
	checkOut: janDate(5, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	specialRequests: "Early check-in requested",
	createdOffset: 5,
});
createReservationAndPayment({
	userId: userIds[2],
	guestName: "Sarah Chen",
	guestEmail: "sarah.chen@gmail.com",
	guestPhone: "+81-80-2222-3333",
	floor: "women-only",
	quality: "golden",
	checkIn: janDate(3, 14, 0),
	checkOut: janDate(5, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 10,
});
createReservationAndPayment({
	userId: userIds[3],
	guestName: "Michael Rodriguez",
	guestEmail: "michael.r@gmail.com",
	guestPhone: "+81-70-4444-5555",
	floor: "couples",
	quality: "golden",
	checkIn: janDate(1, 15, 0),
	checkOut: janDate(4, 11, 0),
	numberOfGuests: 2,
	status: "checked-out",
	paymentStatus: "paid",
	specialRequests: "Celebrating New Year",
	createdOffset: 15,
});
createReservationAndPayment({
	userId: userIds[6],
	guestName: "Jessica Park",
	guestEmail: "jessica.park@guest.com",
	guestPhone: "+81-90-5555-6666",
	floor: "women-only",
	quality: "classic",
	checkIn: janDate(4, 16, 0),
	checkOut: janDate(6, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 3,
});
createReservationAndPayment({
	userId: userIds[5],
	guestName: "David Kim",
	guestEmail: "david.kim@example.com",
	guestPhone: "+81-80-7777-8888",
	floor: "men-only",
	quality: "classic",
	checkIn: janDate(6, 18, 0),
	checkOut: janDate(7, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 2,
});

createReservationAndPayment({
	userId: userIds[1],
	guestName: "Akeem Laurence",
	guestEmail: "keemkeem321@gmail.com",
	guestPhone: "+81-90-1234-5678",
	floor: "business",
	quality: "golden",
	checkIn: janDate(10, 15, 0),
	checkOut: janDate(12, 11, 0),
	numberOfGuests: 1,
	status: "cancelled",
	paymentStatus: "failed",
	paymentFailReason: "card_declined",
	createdOffset: 4,
});
createReservationAndPayment({
	userId: userIds[4],
	guestName: "Emily Wong",
	guestEmail: "emily.wong@example.com",
	guestPhone: "+81-90-8888-9999",
	floor: "women-only",
	quality: "milk",
	checkIn: janDate(13, 14, 0),
	checkOut: janDate(16, 11, 0),
	numberOfGuests: 1,
	status: "checked-in",
	paymentStatus: "paid",
	specialRequests: "Quiet room please",
	createdOffset: 7,
});
createReservationAndPayment({
	userId: userIds[3],
	guestName: "Michael Rodriguez",
	guestEmail: "michael.r@gmail.com",
	guestPhone: "+81-70-4444-5555",
	floor: "business",
	quality: "crystal",
	checkIn: janDate(9, 15, 0),
	checkOut: janDate(11, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 8,
});
createReservationAndPayment({
	userId: userIds[2],
	guestName: "Sarah Chen",
	guestEmail: "sarah.chen@gmail.com",
	guestPhone: "+81-80-2222-3333",
	floor: "couples",
	quality: "milk",
	checkIn: janDate(11, 14, 0),
	checkOut: janDate(15, 11, 0),
	numberOfGuests: 2,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 12,
});
createReservationAndPayment({
	userId: userIds[5],
	guestName: "David Kim",
	guestEmail: "david.kim@example.com",
	guestPhone: "+81-80-7777-8888",
	floor: "men-only",
	quality: "milk",
	checkIn: janDate(12, 16, 0),
	checkOut: janDate(14, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 6,
});

createReservationAndPayment({
	userId: userIds[1],
	guestName: "Akeem Laurence",
	guestEmail: "keemkeem321@gmail.com",
	guestPhone: "+81-90-1234-5678",
	floor: "business",
	quality: "milk",
	checkIn: janDate(18, 15, 0),
	checkOut: janDate(21, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	specialRequests: "High floor preferred",
	createdOffset: 5,
});
createReservationAndPayment({
	userId: userIds[7],
	guestName: "Robert Martinez",
	guestEmail: "robert.m@guest.com",
	guestPhone: "+81-90-1111-2222",
	floor: "men-only",
	quality: "classic",
	checkIn: janDate(19, 16, 0),
	checkOut: janDate(20, 11, 0),
	numberOfGuests: 1,
	status: "pending",
	paymentStatus: "unpaid",
	createdOffset: 0,
});
createReservationAndPayment({
	userId: userIds[4],
	guestName: "Emily Wong",
	guestEmail: "emily.wong@example.com",
	guestPhone: "+81-90-8888-9999",
	floor: "women-only",
	quality: "matcha",
	checkIn: janDate(17, 14, 0),
	checkOut: janDate(19, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 3,
});
createReservationAndPayment({
	userId: userIds[3],
	guestName: "Michael Rodriguez",
	guestEmail: "michael.r@gmail.com",
	guestPhone: "+81-70-4444-5555",
	floor: "couples",
	quality: "classic",
	checkIn: janDate(17, 15, 0),
	checkOut: janDate(19, 11, 0),
	numberOfGuests: 2,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 7,
});
createReservationAndPayment({
	userId: userIds[2],
	guestName: "Sarah Chen",
	guestEmail: "sarah.chen@gmail.com",
	guestPhone: "+81-80-2222-3333",
	floor: "women-only",
	quality: "classic",
	checkIn: janDate(20, 14, 0),
	checkOut: janDate(22, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	paymentAmount: 15000,
	specialRequests: "Overpayment - needs partial refund",
	createdOffset: 2,
});

createReservationAndPayment({
	userId: userIds[1],
	guestName: "Akeem Laurence",
	guestEmail: "keemkeem321@gmail.com",
	guestPhone: "+81-90-1234-5678",
	floor: "business",
	quality: "golden",
	checkIn: janDate(23, 15, 0),
	checkOut: janDate(28, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	specialRequests: "Work trip - need strong WiFi",
	createdOffset: 8,
});
createReservationAndPayment({
	userId: userIds[5],
	guestName: "David Kim",
	guestEmail: "david.kim@example.com",
	guestPhone: "+81-80-7777-8888",
	floor: "couples",
	quality: "golden",
	checkIn: janDate(24, 14, 0),
	checkOut: janDate(26, 11, 0),
	numberOfGuests: 2,
	status: "confirmed",
	paymentStatus: "paid",
	specialRequests: "Anniversary celebration",
	createdOffset: 10,
});
createReservationAndPayment({
	userId: userIds[2],
	guestName: "Sarah Chen",
	guestEmail: "sarah.chen@gmail.com",
	guestPhone: "+81-80-2222-3333",
	floor: "women-only",
	quality: "milk",
	checkIn: janDate(25, 14, 0),
	checkOut: janDate(27, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 9,
});
createReservationAndPayment({
	userId: userIds[4],
	guestName: "Emily Wong",
	guestEmail: "emily.wong@example.com",
	guestPhone: "+81-90-8888-9999",
	floor: "women-only",
	quality: "milk",
	checkIn: janDate(25, 14, 0),
	checkOut: janDate(27, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 9,
});
createReservationAndPayment({
	userId: userIds[3],
	guestName: "Michael Rodriguez",
	guestEmail: "michael.r@gmail.com",
	guestPhone: "+81-70-4444-5555",
	floor: "men-only",
	quality: "golden",
	checkIn: janDate(26, 18, 0),
	checkOut: janDate(28, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 1,
});
createReservationAndPayment({
	userId: userIds[6],
	guestName: "Jessica Park",
	guestEmail: "jessica.park@guest.com",
	guestPhone: "+81-90-5555-6666",
	floor: "women-only",
	quality: "golden",
	checkIn: janDate(27, 14, 0),
	checkOut: janDate(29, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "refunded",
	refundAmount: 4750,
	specialRequests: "Shortened stay - partial refund issued",
	createdOffset: 12,
});

createReservationAndPayment({
	userId: userIds[1],
	guestName: "Akeem Laurence",
	guestEmail: "keemkeem321@gmail.com",
	guestPhone: "+81-90-1234-5678",
	floor: "business",
	quality: "crystal",
	checkIn: janDate(29, 15, 0),
	checkOut: janDate(31, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 6,
});
createReservationAndPayment({
	userId: userIds[4],
	guestName: "Emily Wong",
	guestEmail: "emily.wong@example.com",
	guestPhone: "+81-90-8888-9999",
	floor: "women-only",
	quality: "classic",
	checkIn: janDate(30, 16, 0),
	checkOut: janDate(31, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 3,
});
createReservationAndPayment({
	userId: userIds[7],
	guestName: "Robert Martinez",
	guestEmail: "robert.m@guest.com",
	guestPhone: "+81-90-1111-2222",
	floor: "men-only",
	quality: "milk",
	checkIn: janDate(8, 15, 0),
	checkOut: janDate(9, 11, 0),
	numberOfGuests: 1,
	status: "no-show",
	paymentStatus: "paid",
	specialRequests: "Guest did not show up",
	createdOffset: 5,
});
createReservationAndPayment({
	userId: userIds[5],
	guestName: "David Kim",
	guestEmail: "david.kim@example.com",
	guestPhone: "+81-80-7777-8888",
	floor: "business",
	quality: "milk",
	checkIn: janDate(15, 15, 0),
	checkOut: janDate(17, 11, 0),
	numberOfGuests: 1,
	status: "cancelled",
	paymentStatus: "refunded",
	refundAmount: 15000,
	specialRequests: "Cancelled due to emergency - full refund",
	createdOffset: 10,
});

createReservationAndPayment({
	userId: userIds[2],
	guestName: "Sarah Chen",
	guestEmail: "sarah.chen@gmail.com",
	guestPhone: "+81-80-2222-3333",
	floor: "women-only",
	quality: "classic",
	checkIn: janDate(7, 14, 0),
	checkOut: janDate(9, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 4,
});
createReservationAndPayment({
	userId: userIds[3],
	guestName: "Michael Rodriguez",
	guestEmail: "michael.r@gmail.com",
	guestPhone: "+81-70-4444-5555",
	floor: "men-only",
	quality: "classic",
	checkIn: janDate(5, 16, 0),
	checkOut: janDate(7, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 3,
});
createReservationAndPayment({
	userId: userIds[6],
	guestName: "Jessica Park",
	guestEmail: "jessica.park@guest.com",
	guestPhone: "+81-90-5555-6666",
	floor: "couples",
	quality: "classic",
	checkIn: janDate(8, 15, 0),
	checkOut: janDate(10, 11, 0),
	numberOfGuests: 2,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 6,
});
createReservationAndPayment({
	userId: userIds[4],
	guestName: "Emily Wong",
	guestEmail: "emily.wong@example.com",
	guestPhone: "+81-90-8888-9999",
	floor: "business",
	quality: "classic",
	checkIn: janDate(14, 15, 0),
	checkOut: janDate(16, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 5,
});
createReservationAndPayment({
	userId: userIds[1],
	guestName: "Akeem Laurence",
	guestEmail: "keemkeem321@gmail.com",
	guestPhone: "+81-90-1234-5678",
	floor: "men-only",
	quality: "golden",
	checkIn: janDate(16, 18, 0),
	checkOut: janDate(18, 11, 0),
	numberOfGuests: 1,
	status: "checked-out",
	paymentStatus: "paid",
	createdOffset: 4,
});
createReservationAndPayment({
	userId: userIds[5],
	guestName: "David Kim",
	guestEmail: "david.kim@example.com",
	guestPhone: "+81-80-7777-8888",
	floor: "couples",
	quality: "milk",
	checkIn: janDate(19, 14, 0),
	checkOut: janDate(21, 11, 0),
	numberOfGuests: 2,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 7,
});
createReservationAndPayment({
	userId: userIds[7],
	guestName: "Robert Martinez",
	guestEmail: "robert.m@guest.com",
	guestPhone: "+81-90-1111-2222",
	floor: "business",
	quality: "classic",
	checkIn: janDate(21, 16, 0),
	checkOut: janDate(23, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 4,
});
createReservationAndPayment({
	userId: userIds[2],
	guestName: "Sarah Chen",
	guestEmail: "sarah.chen@gmail.com",
	guestPhone: "+81-80-2222-3333",
	floor: "women-only",
	quality: "golden",
	checkIn: janDate(22, 14, 0),
	checkOut: janDate(24, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 6,
});
createReservationAndPayment({
	userId: userIds[3],
	guestName: "Michael Rodriguez",
	guestEmail: "michael.r@gmail.com",
	guestPhone: "+81-70-4444-5555",
	floor: "men-only",
	quality: "milk",
	checkIn: janDate(28, 17, 0),
	checkOut: janDate(30, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 5,
});
createReservationAndPayment({
	userId: userIds[6],
	guestName: "Jessica Park",
	guestEmail: "jessica.park@guest.com",
	guestPhone: "+81-90-5555-6666",
	floor: "women-only",
	quality: "milk",
	checkIn: janDate(28, 14, 0),
	checkOut: janDate(30, 11, 0),
	numberOfGuests: 1,
	status: "confirmed",
	paymentStatus: "paid",
	createdOffset: 8,
});

// ============================================
// STEP 7: INSERT RESERVATIONS & PAYMENTS
// ============================================
print("\nInserting reservations and payments...");

if (reservations.length > 0) {
	const resResult = db.reservations.insertMany(reservations);
	const reservationInsertedIds = Object.values(resResult.insertedIds);
	payments.forEach((payment, idx) => {
		payment.reservationId = reservationInsertedIds[idx];
	});
	const payResult = db.payments.insertMany(payments);
	print(`✓ Inserted ${reservations.length} reservations`);
	print(`✓ Inserted ${payments.length} payments\n`);
} else {
	print("⚠️  No reservations created\n");
}

// ============================================
// STEP 8: SUMMARY REPORT
// ============================================
print("========================================");
print("SEEDING COMPLETE - SUMMARY REPORT");
print("========================================\n");

print("--- COLLECTIONS ---");
print(`Offerings: ${db.offerings.countDocuments()}`);
print(`Rooms: ${db.rooms.countDocuments()}`);
print(`Users: ${db.users.countDocuments()}`);
print(`Reservations: ${db.reservations.countDocuments()}`);
print(`Payments: ${db.payments.countDocuments()}\n`);

print("--- USER ACCOUNTS (Staff) ---");
print("Admin: admin@tioca.com / password123");
print("  └─ Full CRUD: Rooms, Offerings, Refunds");
print("Manager: manager@tioca.com / password123");
print("  └─ Operations: Reservations, Check-in/out, Reports");
print("\nCustomer Accounts:");
users.slice(2).forEach((u) => {
	const type =
		u.provider === "google"
			? "(Google OAuth)"
			: u.provider === "guest"
			? "(Guest)"
			: "(Local)";
	print(`  - ${u.email} ${type}`);
});

try {
	const statusCounts = db.reservations
		.aggregate([
			{ $group: { _id: "$status", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		])
		.toArray();
	print("\n--- RESERVATION STATUS BREAKDOWN ---");
	statusCounts.forEach((s) => {
		print(`  ${s._id}: ${s.count}`);
	});
} catch (e) {
	print("\n--- RESERVATION STATUS BREAKDOWN ---");
	print("  (No reservations)");
}

try {
	const paymentCounts = db.payments
		.aggregate([
			{ $group: { _id: "$status", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		])
		.toArray();
	print("\n--- PAYMENT STATUS BREAKDOWN ---");
	paymentCounts.forEach((p) => {
		print(`  ${p._id}: ${p.count}`);
	});
} catch (e) {
	print("\n--- PAYMENT STATUS BREAKDOWN ---");
	print("  (No payments)");
}

try {
	const revenue = db.payments
		.aggregate([
			{ $match: { status: "succeeded" } },
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		])
		.toArray();
	print("\n--- REVENUE SUMMARY ---");
	if (revenue.length > 0)
		print(`Total revenue (succeeded): $${(revenue[0].total / 100).toFixed(2)}`);
} catch (e) {
	print("\n--- REVENUE SUMMARY ---");
	print("  (No revenue data)");
}

print("\n========================================");
print("✓ Dataset ready for testing!");
print("========================================\n");
