// MongoDB Playground - TIOCA January 2026 Complete Test Dataset
// ================================================================
// Comprehensive seeder for full month (January 2026) of realistic data
// Wipes and recreates: offerings, rooms, users, reservations, payments
//
// Usage: Run this script in MongoDB Playground or mongosh
// Warning: Drops all data in tioca-reservation-system database!
//
// Dataset includes:
// - ~60-70% occupancy across January with realistic patterns
// - Mix of user types (local, Google OAuth, guests)
// - Various payment states (succeeded, failed, refunded, processing)
// - Reservation statuses (pending, confirmed, checked-in/out, cancelled, no-show)
// - Overlapping bookings to test conflict logic
// - Open inventory for manual booking tests

use("tioca-reservation-system");

print("========================================");
print("TIOCA JANUARY 2026 DATASET SEEDER");
print("========================================\n");
print("⚠️  WARNING: This will DROP all data!\n");

// ============================================
// STEP 1: DROP ALL COLLECTIONS
// ============================================
print("STEP 1: Dropping all collections...");

db.offerings.drop();
db.rooms.drop();
db.users.drop();
db.reservations.drop();
db.payments.drop();
db.holds.drop();

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
		basePrice: 6499, // $64.99/night
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
		basePrice: 7499, // $74.99/night
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
		basePrice: 9499, // $94.99/night
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
		basePrice: 9499, // $94.99/night
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
		basePrice: 15499, // $154.99/night
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
	// Twin variants for couples floor
	{
		name: "Twin Classic Pearl",
		type: "room",
		quality: "classic",
		basePrice: 8499, // $84.99/night
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
		basePrice: 9999, // $99.99/night
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
		basePrice: 12499, // $124.99/night
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
		basePrice: 1500, // $15/night
		priceType: "per-night",
		description: "Complimentary breakfast each morning",
		applicableQualities: [],
		isActive: true,
	},
	{
		name: "Late Checkout",
		type: "amenity",
		basePrice: 2000, // $20 flat
		priceType: "flat",
		description: "Checkout until 2 PM instead of 11 AM",
		applicableQualities: [],
		isActive: true,
	},
	{
		name: "Spa Credit",
		type: "amenity",
		basePrice: 5000, // $50 flat
		priceType: "flat",
		description: "$50 credit toward spa services",
		applicableQualities: ["golden", "crystal", "matcha"],
		isActive: true,
	},
	{
		name: "Airport Transfer",
		type: "amenity",
		basePrice: 3000, // $30 flat
		priceType: "flat",
		description: "Round-trip airport transfer",
		applicableQualities: [],
		isActive: true,
	},
];

let offeringsResult;
let offeringIds;

try {
	offeringsResult = db.offerings.insertMany([
		...ROOM_OFFERINGS,
		...AMENITY_OFFERINGS,
	]);
	offeringIds = offeringsResult.insertedIds;
	print(`✓ Inserted ${Object.keys(offeringIds).length} offerings\n`);
} catch (e) {
	print(`Error inserting offerings: ${e.message}`);
	print("Attempting to retrieve existing offerings...");
	const existingOfferings = db.offerings.find({}).toArray();
	if (existingOfferings.length > 0) {
		existingOfferings.forEach((o, idx) => {
			offeringIds = offeringIds || {};
			offeringIds[idx] = o._id;
		});
		print(`✓ Using ${existingOfferings.length} existing offerings\n`);
	} else {
		throw new Error("Could not create or find offerings");
	}
}

// Map offerings by quality for room creation
const offeringMap = {};
const twinOfferingMap = {};
ROOM_OFFERINGS.forEach((offering, idx) => {
	const id = offeringIds[idx];
	if (offering.variant === "twin") {
		twinOfferingMap[offering.quality] = id;
	} else {
		offeringMap[offering.quality] = id;
	}
});

print(`✓ Inserted ${Object.keys(offeringIds).length} offerings\n`);

// ============================================
// STEP 3: SEED ROOMS (100 pods)
// ============================================
print("STEP 3: Seeding rooms (100 pods)...");

function createRoomsForFloor({
	floorKey,
	floorDigit,
	distributions,
	isTwinFloor = false,
}) {
	const rooms = [];
	let seq = 1;

	for (const dist of distributions) {
		const { quality, count } = dist;
		for (let i = 0; i < count; i++) {
			const podNumber = floorDigit * 100 + seq;
			const podId = String(podNumber);
			const offeringId = isTwinFloor
				? twinOfferingMap[quality]
				: offeringMap[quality];

			rooms.push({
				podId,
				quality,
				floor: floorKey,
				offeringId,
				description: `${quality} quality on ${floorKey} floor`,
				amenities: [],
				images: [],
				status: "available",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			seq++;
		}
	}
	return rooms;
}

const womenRooms = createRoomsForFloor({
	floorKey: "women-only",
	floorDigit: 1,
	distributions: [
		{ quality: "classic", count: 10 },
		{ quality: "milk", count: 8 },
		{ quality: "golden", count: 5 },
		{ quality: "matcha", count: 2 },
	],
});

const menRooms = createRoomsForFloor({
	floorKey: "men-only",
	floorDigit: 2,
	distributions: [
		{ quality: "classic", count: 12 },
		{ quality: "milk", count: 8 },
		{ quality: "golden", count: 5 },
	],
});

const couplesRooms = createRoomsForFloor({
	floorKey: "couples",
	floorDigit: 3,
	isTwinFloor: true,
	distributions: [
		{ quality: "classic", count: 8 },
		{ quality: "milk", count: 10 },
		{ quality: "golden", count: 7 },
	],
});

const businessRooms = createRoomsForFloor({
	floorKey: "business",
	floorDigit: 4,
	distributions: [
		{ quality: "classic", count: 10 },
		{ quality: "milk", count: 8 },
		{ quality: "golden", count: 5 },
		{ quality: "crystal", count: 2 },
	],
});

const allRooms = [
	...womenRooms,
	...menRooms,
	...couplesRooms,
	...businessRooms,
];

let roomsResult;
try {
	roomsResult = db.rooms.insertMany(allRooms);
	print(`✓ Inserted ${Object.keys(roomsResult.insertedIds).length} rooms\n`);
} catch (e) {
	print(`Error inserting rooms: ${e.message}\n`);
	throw e;
}

// Create room lookup for reservations
const roomsByFloorQuality = {};
allRooms.forEach((room, idx) => {
	const key = `${room.floor}-${room.quality}`;
	if (!roomsByFloorQuality[key]) {
		roomsByFloorQuality[key] = [];
	}
	roomsByFloorQuality[key].push({
		_id: roomsResult.insertedIds[idx],
		podId: room.podId,
		floor: room.floor,
		quality: room.quality,
	});
});

// ============================================
// STEP 4: SEED USERS
// ============================================
print("STEP 4: Seeding users...");

const users = [
	// Admin account (local strategy) - Full CRUD access to rooms, offerings, refunds
	{
		provider: "local",
		name: "Admin",
		email: "admin@tioca.com",
		password: "$2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG", // password123
		role: "admin",
		createdAt: new Date("2025-12-01T00:00:00Z"),
		lastLogin: new Date("2026-01-15T09:15:00Z"),
	},
	// Manager account (local strategy) - Operational access (reservations, check-in/out, reports)
	{
		provider: "local",
		name: "Manager",
		email: "manager@tioca.com",
		password: "$2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG", // password123
		role: "manager",
		createdAt: new Date("2025-12-01T00:00:00Z"),
		lastLogin: new Date("2026-01-15T09:00:00Z"),
	},
	// Google OAuth users
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
	// Local strategy regular users
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
	// Guest-only accounts (for reservations without login)
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

const usersResult = db.users.insertMany(users);
let userIds = usersResult.insertedIds;

if (!userIds || Object.keys(userIds).length === 0) {
	print("⚠️  Warning: Users insertion returned no IDs");
	const existingUsers = db.users.find({}).toArray();
	userIds = {};
	existingUsers.forEach((u, idx) => {
		userIds[idx] = u._id;
	});
}

print(`✓ Inserted ${Object.keys(userIds).length} users\n`);

// ============================================
// STEP 5: HELPER FUNCTIONS
// ============================================

// Date helpers for January 2026
function janDate(day, hour = 0, minute = 0) {
	return new Date(2026, 0, day, hour, minute, 0, 0); // Month 0 = January
}

function nightsBetween(checkIn, checkOut) {
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	return Math.max(1, Math.round((checkOut - checkIn) / MS_PER_DAY));
}

function calculatePrice(basePrice, nights) {
	return basePrice * nights;
}

function getRandomRoom(floorKey, qualityKey) {
	const key = `${floorKey}-${qualityKey}`;
	const rooms = roomsByFloorQuality[key];
	if (!rooms || rooms.length === 0) {
		throw new Error(`No rooms found for ${key}`);
	}
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

// Track room occupancy to create realistic overlaps and gaps
const roomOccupancy = {}; // key: roomId, value: array of {checkIn, checkOut}

function isRoomAvailable(roomId, checkIn, checkOut) {
	const occupancy = roomOccupancy[roomId] || [];
	for (const period of occupancy) {
		if (checkIn < period.checkOut && checkOut > period.checkIn) {
			return false; // Overlap detected
		}
	}
	return true;
}

function bookRoom(roomId, checkIn, checkOut) {
	if (!roomOccupancy[roomId]) {
		roomOccupancy[roomId] = [];
	}
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
	paymentAmount = null, // null = exact, otherwise specify
	specialRequests = "",
	paymentFailReason = null,
	refundAmount = 0,
	createdOffset = 0, // days before check-in
}) {
	const room = getRandomRoom(floor, quality);

	// Check availability
	if (!isRoomAvailable(room._id, checkIn, checkOut)) {
		// Try to find another room
		const key = `${floor}-${quality}`;
		const availableRooms = roomsByFloorQuality[key].filter((r) =>
			isRoomAvailable(r._id, checkIn, checkOut)
		);
		if (availableRooms.length === 0) {
			print(
				`⚠️  No available ${floor} ${quality} rooms for ${checkIn.toDateString()}`
			);
			return;
		}
		room._id = availableRooms[0]._id;
		room.podId = availableRooms[0].podId;
	}

	bookRoom(room._id, checkIn, checkOut);

	const nights = nightsBetween(checkIn, checkOut);
	const basePrice = getBasePrice(floor, quality);
	const totalPrice = calculatePrice(basePrice, nights);
	const actualPaymentAmount =
		paymentAmount !== null ? paymentAmount : totalPrice;

	const createdAt = new Date(
		checkIn.getTime() - createdOffset * 24 * 60 * 60 * 1000
	);
	const updatedAt = new Date(createdAt.getTime() + 3600000); // 1 hour later

	const reservationId = reservationCounter++;
	const stripeCustomerId = `cus_jan_${String(reservationId).padStart(4, "0")}`;
	const stripePaymentIntentId = `pi_jan_${String(paymentCounter).padStart(
		4,
		"0"
	)}`;
	const stripeChargeId =
		paymentStatus === "paid"
			? `ch_jan_${String(paymentCounter).padStart(4, "0")}`
			: null;

	const reservation = {
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
		specialRequests,
		createdAt,
		updatedAt,
	};

	reservations.push(reservation);

	// Create payment record
	const paymentStatusMap = {
		paid: "succeeded",
		unpaid: "pending",
		partial: "succeeded",
		failed: "failed",
		refunded: "succeeded",
	};

	const payment = {
		reservationId: null, // Will be set after insertion
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
		refundAmount,
		refundReason: refundAmount > 0 ? "Customer requested refund" : null,
		failureReason: paymentFailReason,
		metadata: {
			checkIn: checkIn.toISOString(),
			checkOut: checkOut.toISOString(),
			roomPodId: room.podId,
			nights,
		},
		createdAt,
		updatedAt,
	};

	payments.push(payment);
	paymentCounter++;
}

// ============================================
// JANUARY BOOKING SCENARIOS
// ============================================

// Week 1: January 1-7
// Business traveler - multi-night stay
createReservationAndPayment({
	userId: userIds[1], // Akeem
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

// Women-only - weekend stay
createReservationAndPayment({
	userId: userIds[2], // Sarah
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

// Couples - New Year stay
createReservationAndPayment({
	userId: userIds[3], // Michael
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

// Guest booking - no account
createReservationAndPayment({
	userId: userIds[6], // Jessica (guest)
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

// Men-only - single night
createReservationAndPayment({
	userId: userIds[5], // David
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

// Week 2: January 8-14
// Failed payment scenario
createReservationAndPayment({
	userId: userIds[1], // Akeem
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

// Currently checked-in guest
createReservationAndPayment({
	userId: userIds[4], // Emily
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

// Business - premium suite
createReservationAndPayment({
	userId: userIds[3], // Michael
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

// Couples - long stay
createReservationAndPayment({
	userId: userIds[2], // Sarah
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

// Men-only - multiple pods booked (different stays)
createReservationAndPayment({
	userId: userIds[5], // David
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

// Week 3: January 15-21 (Current week)
// Confirmed future booking
createReservationAndPayment({
	userId: userIds[1], // Akeem
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

// Pending payment - booking today
createReservationAndPayment({
	userId: userIds[7], // Robert (guest)
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

// Women-only - confirmed
createReservationAndPayment({
	userId: userIds[4], // Emily
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

// Couples - weekend booking
createReservationAndPayment({
	userId: userIds[3], // Michael
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

// Overpayment scenario (needs refund)
createReservationAndPayment({
	userId: userIds[2], // Sarah
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
	paymentAmount: 15000, // Overpaid by $20
	specialRequests: "Overpayment - needs partial refund",
	createdOffset: 2,
});

// Week 4: January 22-28
// Business traveler - extended stay
createReservationAndPayment({
	userId: userIds[1], // Akeem
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

// Couples - anniversary
createReservationAndPayment({
	userId: userIds[5], // David
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

// Women-only - group bookings (separate reservations)
createReservationAndPayment({
	userId: userIds[2], // Sarah
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
	userId: userIds[4], // Emily
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

// Men-only - last minute booking
createReservationAndPayment({
	userId: userIds[3], // Michael
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

// Partial refund scenario (reservation modified)
createReservationAndPayment({
	userId: userIds[6], // Jessica
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
	refundAmount: 4750, // Partial refund (half of one night)
	specialRequests: "Shortened stay - partial refund issued",
	createdOffset: 12,
});

// Week 5: January 29-31
// End of month bookings
createReservationAndPayment({
	userId: userIds[1], // Akeem
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
	userId: userIds[4], // Emily
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

// No-show scenario
createReservationAndPayment({
	userId: userIds[7], // Robert
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

// Cancelled with refund
createReservationAndPayment({
	userId: userIds[5], // David
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
	refundAmount: 15000, // Full refund
	specialRequests: "Cancelled due to emergency - full refund",
	createdOffset: 10,
});

// Additional bookings to reach ~60% occupancy
// Spread across different dates and rooms
const additionalBookings = [
	{
		userId: userIds[2],
		guestName: "Sarah Chen",
		guestEmail: "sarah.chen@gmail.com",
		floor: "women-only",
		quality: "classic",
		checkIn: janDate(7, 14, 0),
		checkOut: janDate(9, 11, 0),
		numberOfGuests: 1,
		status: "checked-out",
		paymentStatus: "paid",
		createdOffset: 4,
	},
	{
		userId: userIds[3],
		guestName: "Michael Rodriguez",
		guestEmail: "michael.r@gmail.com",
		floor: "men-only",
		quality: "classic",
		checkIn: janDate(5, 16, 0),
		checkOut: janDate(7, 11, 0),
		numberOfGuests: 1,
		status: "checked-out",
		paymentStatus: "paid",
		createdOffset: 3,
	},
	{
		userId: userIds[6],
		guestName: "Jessica Park",
		guestEmail: "jessica.park@guest.com",
		floor: "couples",
		quality: "classic",
		checkIn: janDate(8, 15, 0),
		checkOut: janDate(10, 11, 0),
		numberOfGuests: 2,
		status: "checked-out",
		paymentStatus: "paid",
		createdOffset: 6,
	},
	{
		userId: userIds[4],
		guestName: "Emily Wong",
		guestEmail: "emily.wong@example.com",
		floor: "business",
		quality: "classic",
		checkIn: janDate(14, 15, 0),
		checkOut: janDate(16, 11, 0),
		numberOfGuests: 1,
		status: "checked-out",
		paymentStatus: "paid",
		createdOffset: 5,
	},
	{
		userId: userIds[1],
		guestName: "Akeem Laurence",
		guestEmail: "keemkeem321@gmail.com",
		floor: "men-only",
		quality: "golden",
		checkIn: janDate(16, 18, 0),
		checkOut: janDate(18, 11, 0),
		numberOfGuests: 1,
		status: "checked-out",
		paymentStatus: "paid",
		createdOffset: 4,
	},
	{
		userId: userIds[5],
		guestName: "David Kim",
		guestEmail: "david.kim@example.com",
		floor: "couples",
		quality: "milk",
		checkIn: janDate(19, 14, 0),
		checkOut: janDate(21, 11, 0),
		numberOfGuests: 2,
		status: "confirmed",
		paymentStatus: "paid",
		createdOffset: 7,
	},
	{
		userId: userIds[7],
		guestName: "Robert Martinez",
		guestEmail: "robert.m@guest.com",
		floor: "business",
		quality: "classic",
		checkIn: janDate(21, 16, 0),
		checkOut: janDate(23, 11, 0),
		numberOfGuests: 1,
		status: "confirmed",
		paymentStatus: "paid",
		createdOffset: 4,
	},
	{
		userId: userIds[2],
		guestName: "Sarah Chen",
		guestEmail: "sarah.chen@gmail.com",
		floor: "women-only",
		quality: "golden",
		checkIn: janDate(22, 14, 0),
		checkOut: janDate(24, 11, 0),
		numberOfGuests: 1,
		status: "confirmed",
		paymentStatus: "paid",
		createdOffset: 6,
	},
	{
		userId: userIds[3],
		guestName: "Michael Rodriguez",
		guestEmail: "michael.r@gmail.com",
		floor: "men-only",
		quality: "milk",
		checkIn: janDate(28, 17, 0),
		checkOut: janDate(30, 11, 0),
		numberOfGuests: 1,
		status: "confirmed",
		paymentStatus: "paid",
		createdOffset: 5,
	},
	{
		userId: userIds[6],
		guestName: "Jessica Park",
		guestEmail: "jessica.park@guest.com",
		floor: "women-only",
		quality: "milk",
		checkIn: janDate(28, 14, 0),
		checkOut: janDate(30, 11, 0),
		numberOfGuests: 1,
		status: "confirmed",
		paymentStatus: "paid",
		createdOffset: 8,
	},
];

additionalBookings.forEach((booking) => createReservationAndPayment(booking));

// ============================================
// STEP 7: INSERT RESERVATIONS & PAYMENTS
// ============================================
print("\nInserting reservations and payments...");

if (reservations.length > 0) {
	const reservationsResult = db.reservations.insertMany(reservations);
	const reservationInsertedIds = Object.values(reservationsResult.insertedIds);

	// Update payments with reservation IDs
	payments.forEach((payment, idx) => {
		payment.reservationId = reservationInsertedIds[idx];
	});

	const paymentsResult = db.payments.insertMany(payments);

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
users.slice(2).forEach((user) => {
	const loginType =
		user.provider === "google"
			? "(Google OAuth)"
			: user.provider === "guest"
			? "(Guest)"
			: "(Local)";
	print(`  - ${user.email} ${loginType}`);
});

print("\n--- RESERVATION STATUS BREAKDOWN ---");
try {
	const statusCounts = db.reservations
		.aggregate([
			{ $group: { _id: "$status", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		])
		.toArray();
	statusCounts.forEach((stat) => {
		print(`  ${stat._id}: ${stat.count}`);
	});
} catch (e) {
	print(`  (No reservations to count)`);
}

print("\n--- PAYMENT STATUS BREAKDOWN ---");
try {
	const paymentStatusCounts = db.payments
		.aggregate([
			{ $group: { _id: "$status", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		])
		.toArray();
	paymentStatusCounts.forEach((stat) => {
		print(`  ${stat._id}: ${stat.count}`);
	});
} catch (e) {
	print(`  (No payments to count)`);
}

print("\n--- REVENUE SUMMARY ---");
try {
	const totalRevenue = db.payments
		.aggregate([
			{ $match: { status: "succeeded" } },
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		])
		.toArray();
	if (totalRevenue.length > 0) {
		print(
			`Total revenue (succeeded): $${(totalRevenue[0].total / 100).toFixed(2)}`
		);
	}
} catch (e) {
	print("  (No revenue data)");
}

try {
	const refundedAmount = db.payments
		.aggregate([
			{ $match: { refundAmount: { $gt: 0 } } },
			{ $group: { _id: null, total: { $sum: "$refundAmount" } } },
		])
		.toArray();
	if (refundedAmount.length > 0) {
		print(`Total refunded: $${(refundedAmount[0].total / 100).toFixed(2)}`);
	}
} catch (e) {
	print("  (No refund data)");
}

print("\n--- ROOM OCCUPANCY ---");
try {
	const occupancyByFloor = db.reservations
		.aggregate([
			{
				$lookup: {
					from: "rooms",
					localField: "roomId",
					foreignField: "_id",
					as: "room",
				},
			},
			{ $unwind: "$room" },
			{ $group: { _id: "$room.floor", count: { $sum: 1 } } },
			{ $sort: { _id: 1 } },
		])
		.toArray();
	occupancyByFloor.forEach((floor) => {
		print(`  ${floor._id}: ${floor.count} bookings`);
	});
} catch (e) {
	print("  (No occupancy data)");
}

print("\n--- SAMPLE AVAILABLE PODS (for testing) ---");
try {
	const sampleAvailablePods = db.rooms
		.find({ status: "available" })
		.limit(5)
		.toArray();
	sampleAvailablePods.forEach((room) => {
		print(`  Pod ${room.podId} (${room.floor}, ${room.quality})`);
	});
} catch (e) {
	print("  (Could not retrieve sample pods)");
}

print("\n========================================");
print("✓ Dataset ready for testing!");
print("========================================\n");
