// MongoDB Playground file for TIOCA Reservation System - Test Reservations
// Seeds realistic reservations using existing rooms in the database.
// Ensures bookings for:
//  - Google OAuth user: keemkeem321@gmail.com
//  - Manager user: manager@tioca.com
//
// Notes:
// - Uses real rooms from the 'rooms' collection
// - Creates upcoming (active) and past reservations
// - Computes total price from room pricePerNight and number of nights

use("tioca-reservation-system");

function nightsBetween(startDate, endDate) {
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	const start = new Date(startDate);
	const end = new Date(endDate);
	// Normalize to midnight to avoid DST issues
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);
	return Math.max(1, Math.round((end - start) / MS_PER_DAY));
}

function priceForStay(room, startDate, endDate) {
	return room.pricePerNight * nightsBetween(startDate, endDate);
}

// Fetch users
const googleUser = db.users.findOne({ email: "keemkeem321@gmail.com" });
const managerUser = db.users.findOne({ email: "manager@tioca.com" });

if (!googleUser) {
	throw new Error(
		"Google OAuth user keemkeem321@gmail.com not found. Run users playground or login via Google first."
	);
}
if (!managerUser) {
	throw new Error(
		"Manager user manager@tioca.com not found. Run users playground first."
	);
}

// Select real rooms from each floor for variety
const menOnlyRoom = db.rooms.find({ floor: "men-only" }).limit(1).toArray()[0];
const businessRoom = db.rooms.find({ floor: "business" }).limit(1).toArray()[0];
const couplesRoom = db.rooms.find({ floor: "couples" }).limit(1).toArray()[0];

if (!menOnlyRoom || !businessRoom || !couplesRoom) {
	throw new Error(
		"Insufficient rooms found. Ensure rooms playground/seed has populated rooms for men-only, business, and couples floors."
	);
}

// Dates
const today = new Date();
const d = (offset) =>
	new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);

// Build reservations
const reservations = [];

// Google user - upcoming active reservation (men-only)
{
	const checkIn = d(7); // 1 week from now
	const checkOut = d(10); // 3 nights
	reservations.push({
		roomId: menOnlyRoom._id,
		userId: googleUser._id,
		guestName: googleUser.name || "Google User",
		guestEmail: googleUser.email,
		numberOfGuests: 1,
		checkInDate: checkIn,
		checkOutDate: checkOut,
		totalPrice: priceForStay(menOnlyRoom, checkIn, checkOut),
		status: "confirmed",
		paymentStatus: "paid",
		specialRequests: "Late check-in requested",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

// Google user - past completed reservation (business)
{
	const checkIn = d(-30);
	const checkOut = d(-27); // 3 nights past
	reservations.push({
		roomId: businessRoom._id,
		userId: googleUser._id,
		guestName: googleUser.name || "Google User",
		guestEmail: googleUser.email,
		numberOfGuests: 1,
		checkInDate: checkIn,
		checkOutDate: checkOut,
		totalPrice: priceForStay(businessRoom, checkIn, checkOut),
		status: "checked-out",
		paymentStatus: "paid",
		specialRequests: "High-floor preferred",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

// Manager user - upcoming active reservation (business)
{
	const checkIn = d(2);
	const checkOut = d(5); // 3 nights
	reservations.push({
		roomId: businessRoom._id,
		userId: managerUser._id,
		guestName: managerUser.name || "Manager",
		guestEmail: managerUser.email,
		numberOfGuests: 1,
		checkInDate: checkIn,
		checkOutDate: checkOut,
		totalPrice: priceForStay(businessRoom, checkIn, checkOut),
		status: "confirmed",
		paymentStatus: "paid",
		specialRequests: "Quiet pod near workspace",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

// Manager user - upcoming couples reservation (2 guests)
{
	const checkIn = d(12);
	const checkOut = d(14); // 2 nights
	reservations.push({
		roomId: couplesRoom._id,
		userId: managerUser._id,
		guestName: managerUser.name || "Manager",
		guestEmail: managerUser.email,
		numberOfGuests: 2,
		checkInDate: checkIn,
		checkOutDate: checkOut,
		totalPrice: priceForStay(couplesRoom, checkIn, checkOut),
		status: "confirmed",
		paymentStatus: "partial",
		specialRequests: "Anniversary stay",
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

// Clean up potential duplicates for these users around these date ranges (idempotency-ish)
// Remove future reservations for these users to avoid duplicates on re-run
const futureFilter = {
	$or: [{ userId: googleUser._id }, { userId: managerUser._id }],
	checkInDate: { $gte: d(0) },
};
const pastFilter = {
	$or: [{ userId: googleUser._id }, { userId: managerUser._id }],
	status: { $in: ["checked-out", "cancelled"] },
};

db.reservations.deleteMany(futureFilter);
// Keep one exemplar past reservation; remove others for simplicity
// (If you want to keep past history, comment this out)
db.reservations.deleteMany(pastFilter);

// Insert new test reservations
if (reservations.length > 0) {
	db.reservations.insertMany(reservations);
	print(`Inserted ${reservations.length} reservations for test users.`);
	print(
		`Google user upcoming: pod ${menOnlyRoom.podId}, dates ${d(
			7
		).toDateString()} - ${d(10).toDateString()}`
	);
	print(
		`Manager upcoming: pod ${businessRoom.podId}, dates ${d(
			2
		).toDateString()} - ${d(5).toDateString()}`
	);
	print(
		`Manager couples: pod ${couplesRoom.podId}, dates ${d(
			12
		).toDateString()} - ${d(14).toDateString()}`
	);
} else {
	print("No reservations prepared. Check room/user queries.");
}
