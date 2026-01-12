// MongoDB Playground file for TIOCA Reservation System - Users & Payments Test Data
// Creates comprehensive test data with:
// - Google OAuth authenticated users (with real provider IDs)
// - Local strategy test users (manager + guests)
// - Realistic reservations across different statuses
// - Payment records with various states (pending, processing, succeeded, failed, refunded)
// - PaymentEdit records showing edit history

use("tioca-reservation-system");

// ============================================
// 1. CREATE TEST USERS
// ============================================

// Clear existing test users (keep only production-like accounts)
const testEmails = [
	"testuser@tioca.com",
	"guest@tioca.com",
	"akeem.test@tioca.com",
	"sarah.business@tioca.com",
	"james.couples@tioca.com",
	"manager@tioca.com",
];

db.users.deleteMany({ email: { $in: testEmails } });

// Google OAuth Users - using realistic provider IDs
const googleUsers = [
	{
		provider: "google",
		providerId: "101038855044083445001", // Real example from the system
		name: "Akeem Laurence",
		email: "keemkeem321@gmail.com",
		role: "user",
		createdAt: new Date("2025-12-31T19:30:29.050Z"),
		lastLogin: new Date("2026-01-07T19:58:55.481Z"),
	},
	{
		provider: "google",
		providerId: "118527482956738291847", // Different real Google user ID
		name: "Sarah Johnson",
		email: "sarah.johnson.travel@gmail.com",
		role: "user",
		createdAt: new Date("2025-12-15T10:15:00.000Z"),
		lastLogin: new Date("2026-01-08T14:32:12.000Z"),
	},
	{
		provider: "google",
		providerId: "106439247629781234567", // Another Google user ID
		name: "James Chen",
		email: "james.chen.couples@gmail.com",
		role: "user",
		createdAt: new Date("2026-01-01T08:00:00.000Z"),
		lastLogin: new Date("2026-01-08T22:15:40.000Z"),
	},
];

// Local Strategy Users
const localUsers = [
	{
		provider: "local",
		name: "Manager",
		email: "manager@tioca.com",
		password: "$2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG", // password123
		role: "manager",
		createdAt: new Date("2025-12-01T00:00:00.000Z"),
		lastLogin: new Date("2026-01-08T09:00:00.000Z"),
	},
	{
		provider: "local",
		name: "Test User",
		email: "testuser@tioca.com",
		password: "$2b$10$dummyhashedpasswordfortesting123456",
		role: "user",
		createdAt: new Date("2026-01-02T12:30:00.000Z"),
		lastLogin: new Date("2026-01-08T16:45:00.000Z"),
	},
	{
		provider: "local",
		name: "Guest User",
		email: "guest@tioca.com",
		password: "$2b$10$dummyhashedpasswordfortesting123456",
		role: "user",
		createdAt: new Date("2026-01-03T14:20:00.000Z"),
		lastLogin: new Date("2026-01-07T11:00:00.000Z"),
	},
];

const allUsers = [...googleUsers, ...localUsers];
const userInsertResult = db.users.insertMany(allUsers);

print("✓ Inserted users:", Object.keys(userInsertResult.insertedIds).length);
print("  - Google OAuth users: 3");
print("  - Local strategy users: 3");

// Store user IDs for reference
const userIds = {
	akeemGoogle: userInsertResult.insertedIds[0], // Akeem (Google)
	sarahGoogle: userInsertResult.insertedIds[1], // Sarah (Google)
	jamesGoogle: userInsertResult.insertedIds[2], // James (Google)
	manager: userInsertResult.insertedIds[3], // Manager (Local)
	testUser: userInsertResult.insertedIds[4], // Test User (Local)
	guestUser: userInsertResult.insertedIds[5], // Guest User (Local)
};

// ============================================
// 2. GET ROOMS FOR RESERVATIONS
// ============================================

const menOnlyRoom = db.rooms.findOne({ floor: "men-only" });
const womenOnlyRoom = db.rooms.findOne({ floor: "women-only" });
const businessRoom = db.rooms.findOne({ floor: "business" });
const couplesRoom = db.rooms.findOne({ floor: "couples" });

if (!menOnlyRoom || !womenOnlyRoom || !businessRoom || !couplesRoom) {
	throw new Error(
		"Insufficient rooms found. Please run playground-rooms.mongodb.js first."
	);
}

print(
	"\n✓ Retrieved rooms:",
	"men-only=" + menOnlyRoom.podId,
	"women-only=" + womenOnlyRoom.podId,
	"business=" + businessRoom.podId,
	"couples=" + couplesRoom.podId
);

// ============================================
// 3. CREATE REALISTIC RESERVATIONS
// ============================================

// Date helpers
const today = new Date();
today.setHours(0, 0, 0, 0);

const d = (offset) => {
	const date = new Date(today);
	date.setDate(date.getDate() + offset);
	return date;
};

function nightsBetween(startDate, endDate) {
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	const start = new Date(startDate);
	const end = new Date(endDate);
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);
	return Math.max(1, Math.round((end - start) / MS_PER_DAY));
}

function priceForStay(room, startDate, endDate) {
	return room.pricePerNight * nightsBetween(startDate, endDate);
}

// Clear existing test reservations
db.reservations.deleteMany({
	guestEmail: { $in: testEmails },
});

const reservations = [];
const reservationIds = [];

// ---- Reservation 1: Akeem Google - Upcoming confirmed, paid (business room) ----
{
	const checkIn = d(5);
	const checkOut = d(8);
	const totalPrice = priceForStay(businessRoom, checkIn, checkOut);
	const reservation = {
		roomId: businessRoom._id,
		userId: userIds.akeemGoogle,
		guestName: "Akeem Laurence",
		guestEmail: "keemkeem321@gmail.com",
		guestPhone: "+81-90-1234-5678",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "confirmed",
		paymentStatus: "paid",
		stripeCustomerId: "cus_P1Akeem0001",
		stripePaymentIntentId: "pi_akeem_paid_001",
		stripeChargeId: "ch_akeem_paid_001",
		specialRequests: "High floor preferred, quiet location",
		createdAt: new Date("2026-01-08T15:30:00.000Z"),
		updatedAt: new Date("2026-01-08T15:45:00.000Z"),
	};
	reservations.push(reservation);
	const res1 = db.reservations.insertOne(reservation);
	reservationIds.push(res1.insertedId);
}

// ---- Reservation 2: Sarah Google - Past completed, paid (women-only room) ----
{
	const checkIn = d(-15);
	const checkOut = d(-12);
	const totalPrice = priceForStay(womenOnlyRoom, checkIn, checkOut);
	const reservation = {
		roomId: womenOnlyRoom._id,
		userId: userIds.sarahGoogle,
		guestName: "Sarah Johnson",
		guestEmail: "sarah.johnson.travel@gmail.com",
		guestPhone: "+81-70-9876-5432",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "checked-out",
		paymentStatus: "paid",
		stripeCustomerId: "cus_P1Sarah0001",
		stripePaymentIntentId: "pi_sarah_paid_001",
		stripeChargeId: "ch_sarah_paid_001",
		specialRequests: "Clean towels daily",
		createdAt: new Date("2025-12-20T10:00:00.000Z"),
		updatedAt: new Date("2026-01-05T11:00:00.000Z"),
	};
	reservations.push(reservation);
	const res2 = db.reservations.insertOne(reservation);
	reservationIds.push(res2.insertedId);
}

// ---- Reservation 3: James Google - Upcoming pending payment (couples room) ----
{
	const checkIn = d(14);
	const checkOut = d(16);
	const totalPrice = priceForStay(couplesRoom, checkIn, checkOut);
	const reservation = {
		roomId: couplesRoom._id,
		userId: userIds.jamesGoogle,
		guestName: "James Chen",
		guestEmail: "james.chen.couples@gmail.com",
		guestPhone: "+81-80-1111-2222",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 2,
		totalPrice,
		status: "pending",
		paymentStatus: "unpaid",
		stripeCustomerId: "cus_P1James0001",
		stripePaymentIntentId: "pi_james_pending_001",
		specialRequests:
			"Anniversary celebration, surprise flower arrangement if possible",
		createdAt: new Date("2026-01-08T20:15:00.000Z"),
		updatedAt: new Date("2026-01-08T20:15:00.000Z"),
	};
	reservations.push(reservation);
	const res3 = db.reservations.insertOne(reservation);
	reservationIds.push(res3.insertedId);
}

// ---- Reservation 4: Test User - Upcoming with partial payment (men-only room) ----
{
	const checkIn = d(10);
	const checkOut = d(13);
	const totalPrice = priceForStay(menOnlyRoom, checkIn, checkOut);
	const reservation = {
		roomId: menOnlyRoom._id,
		userId: userIds.testUser,
		guestName: "Test User",
		guestEmail: "testuser@tioca.com",
		guestPhone: "+81-90-5555-6666",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "confirmed",
		paymentStatus: "partial",
		stripeCustomerId: "cus_P1Test0001",
		stripePaymentIntentId: "pi_test_partial_001",
		stripeChargeId: "ch_test_partial_001",
		specialRequests: "Testing partial payment flow",
		createdAt: new Date("2026-01-07T08:30:00.000Z"),
		updatedAt: new Date("2026-01-08T09:00:00.000Z"),
	};
	reservations.push(reservation);
	const res4 = db.reservations.insertOne(reservation);
	reservationIds.push(res4.insertedId);
}

// ---- Reservation 5: Guest User - Upcoming cancelled (women-only room) ----
{
	const checkIn = d(25);
	const checkOut = d(28);
	const totalPrice = priceForStay(womenOnlyRoom, checkIn, checkOut);
	const reservation = {
		roomId: womenOnlyRoom._id,
		userId: userIds.guestUser,
		guestName: "Guest User",
		guestEmail: "guest@tioca.com",
		guestPhone: "+81-90-7777-8888",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "cancelled",
		paymentStatus: "refunded",
		stripeCustomerId: "cus_P1Guest0001",
		stripePaymentIntentId: "pi_guest_refunded_001",
		stripeChargeId: "ch_guest_refunded_001",
		cancellationReason: "Changed travel plans",
		cancelledAt: new Date("2026-01-08T12:00:00.000Z"),
		specialRequests: "N/A",
		createdAt: new Date("2026-01-01T14:45:00.000Z"),
		updatedAt: new Date("2026-01-08T12:00:00.000Z"),
	};
	reservations.push(reservation);
	const res5 = db.reservations.insertOne(reservation);
	reservationIds.push(res5.insertedId);
}

// ---- Reservation 6: Akeem Google - Payment failure scenario (business room) ----
{
	const checkIn = d(30);
	const checkOut = d(32);
	const totalPrice = priceForStay(businessRoom, checkIn, checkOut);
	const reservation = {
		roomId: businessRoom._id,
		userId: userIds.akeemGoogle,
		guestName: "Akeem Laurence",
		guestEmail: "keemkeem321@gmail.com",
		guestPhone: "+81-90-1234-5678",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "pending",
		paymentStatus: "unpaid",
		stripeCustomerId: "cus_P1Akeem0001",
		stripePaymentIntentId: "pi_akeem_failed_001",
		specialRequests: "Payment retry needed",
		createdAt: new Date("2026-01-08T18:20:00.000Z"),
		updatedAt: new Date("2026-01-08T18:20:00.000Z"),
	};
	reservations.push(reservation);
	const res6 = db.reservations.insertOne(reservation);
	reservationIds.push(res6.insertedId);
}

print("\n✓ Inserted reservations:", reservations.length);

// ============================================
// 4. CREATE PAYMENT RECORDS
// ============================================

// Clear existing test payments
db.payments.deleteMany({
	$or: [
		{ stripePaymentIntentId: { $regex: "^pi_akeem" } },
		{ stripePaymentIntentId: { $regex: "^pi_sarah" } },
		{ stripePaymentIntentId: { $regex: "^pi_james" } },
		{ stripePaymentIntentId: { $regex: "^pi_test" } },
		{ stripePaymentIntentId: { $regex: "^pi_guest" } },
	],
});

const payments = [];

// ---- Payment 1: Akeem - Paid (succeeded) ----
{
	const payment = {
		reservationId: reservationIds[0],
		userId: userIds.akeemGoogle,
		amount: Math.round(reservations[0].totalPrice * 100), // cents
		currency: "usd",
		status: "succeeded",
		stripePaymentIntentId: "pi_akeem_paid_001",
		stripeChargeId: "ch_akeem_paid_001",
		stripeCustomerId: "cus_P1Akeem0001",
		refundAmount: 0,
		failureReason: null,
		failureCode: null,
		description: `Reservation payment for ${reservations[0].guestName}`,
		receiptUrl: "https://receipts.stripe.com/acct_fake/akeem_001",
		createdAt: new Date("2026-01-08T15:31:00.000Z"),
		updatedAt: new Date("2026-01-08T15:45:00.000Z"),
	};
	payments.push(payment);
	db.payments.insertOne(payment);
}

// ---- Payment 2: Sarah - Paid (succeeded) ----
{
	const payment = {
		reservationId: reservationIds[1],
		userId: userIds.sarahGoogle,
		amount: Math.round(reservations[1].totalPrice * 100), // cents
		currency: "usd",
		status: "succeeded",
		stripePaymentIntentId: "pi_sarah_paid_001",
		stripeChargeId: "ch_sarah_paid_001",
		stripeCustomerId: "cus_P1Sarah0001",
		refundAmount: 0,
		failureReason: null,
		failureCode: null,
		description: `Reservation payment for ${reservations[1].guestName}`,
		receiptUrl: "https://receipts.stripe.com/acct_fake/sarah_001",
		createdAt: new Date("2025-12-20T10:05:00.000Z"),
		updatedAt: new Date("2025-12-20T10:20:00.000Z"),
	};
	payments.push(payment);
	db.payments.insertOne(payment);
}

// ---- Payment 3: James - Pending (not yet processed) ----
{
	const payment = {
		reservationId: reservationIds[2],
		userId: userIds.jamesGoogle,
		amount: Math.round(reservations[2].totalPrice * 100), // cents
		currency: "usd",
		status: "pending",
		stripePaymentIntentId: "pi_james_pending_001",
		stripeChargeId: null,
		stripeCustomerId: "cus_P1James0001",
		refundAmount: 0,
		failureReason: null,
		failureCode: null,
		description: `Reservation payment for ${reservations[2].guestName}`,
		receiptUrl: null,
		createdAt: new Date("2026-01-08T20:16:00.000Z"),
		updatedAt: new Date("2026-01-08T20:16:00.000Z"),
	};
	payments.push(payment);
	db.payments.insertOne(payment);
}

// ---- Payment 4: Test User - Partial payment ----
{
	const totalAmount = Math.round(reservations[3].totalPrice * 100); // cents
	const paidAmount = Math.floor(totalAmount * 0.5); // 50% paid
	const payment = {
		reservationId: reservationIds[3],
		userId: userIds.testUser,
		amount: totalAmount,
		currency: "usd",
		status: "succeeded", // This charge succeeded but is partial
		stripePaymentIntentId: "pi_test_partial_001",
		stripeChargeId: "ch_test_partial_001",
		stripeCustomerId: "cus_P1Test0001",
		refundAmount: 0,
		failureReason: null,
		failureCode: null,
		description: `Partial reservation payment for ${reservations[3].guestName}`,
		receiptUrl: "https://receipts.stripe.com/acct_fake/test_partial_001",
		createdAt: new Date("2026-01-07T08:31:00.000Z"),
		updatedAt: new Date("2026-01-08T09:00:00.000Z"),
	};
	payments.push(payment);
	db.payments.insertOne(payment);
}

// ---- Payment 5: Guest User - Refunded ----
{
	const totalAmount = Math.round(reservations[4].totalPrice * 100); // cents
	const payment = {
		reservationId: reservationIds[4],
		userId: userIds.guestUser,
		amount: totalAmount,
		currency: "usd",
		status: "refunded",
		stripePaymentIntentId: "pi_guest_refunded_001",
		stripeChargeId: "ch_guest_refunded_001",
		stripeCustomerId: "cus_P1Guest0001",
		refundAmount: totalAmount, // Full refund
		refundStripeId: "re_guest_full_refund_001",
		failureReason: null,
		failureCode: null,
		description: `Cancellation refund for ${reservations[4].guestName}`,
		receiptUrl: null,
		createdAt: new Date("2026-01-01T14:50:00.000Z"),
		updatedAt: new Date("2026-01-08T12:15:00.000Z"),
	};
	payments.push(payment);
	db.payments.insertOne(payment);
}

// ---- Payment 6: Akeem - Failed charge (for payment retry testing) ----
{
	const payment = {
		reservationId: reservationIds[5],
		userId: userIds.akeemGoogle,
		amount: Math.round(reservations[5].totalPrice * 100), // cents
		currency: "usd",
		status: "failed",
		stripePaymentIntentId: "pi_akeem_failed_001",
		stripeChargeId: null,
		stripeCustomerId: "cus_P1Akeem0001",
		refundAmount: 0,
		failureReason: "Your card was declined",
		failureCode: "card_declined",
		description: `Failed charge for ${reservations[5].guestName}`,
		receiptUrl: null,
		createdAt: new Date("2026-01-08T18:21:00.000Z"),
		updatedAt: new Date("2026-01-08T18:21:00.000Z"),
	};
	payments.push(payment);
	db.payments.insertOne(payment);
}

print("✓ Inserted payments:", payments.length);

// ============================================
// 5. CREATE PAYMENT EDIT RECORDS (AUDIT TRAIL)
// ============================================

// Clear existing test payment edits
db.paymentedits.deleteMany({
	editedByEmail: "manager@tioca.com",
});

const paymentEdits = [];

// ---- Edit 1: Manager updates description for Akeem's first payment ----
{
	const paymentRecord = db.payments.findOne({
		stripePaymentIntentId: "pi_akeem_paid_001",
	});
	const edit = {
		paymentId: paymentRecord._id,
		editedBy: userIds.manager,
		editedByName: "Manager",
		editedByEmail: "manager@tioca.com",
		fieldName: "description",
		beforeValue: `Reservation payment for ${reservations[0].guestName}`,
		afterValue: `Reservation payment for ${reservations[0].guestName} - Business floor pod ${menOnlyRoom.podId}`,
		reason: "Added pod reference for clarity",
		createdAt: new Date("2026-01-08T16:30:00.000Z"),
	};
	paymentEdits.push(edit);
	db.paymentedits.insertOne(edit);
}

// ---- Edit 2: Manager adds note to Sarah's payment ----
{
	const paymentRecord = db.payments.findOne({
		stripePaymentIntentId: "pi_sarah_paid_001",
	});
	const edit = {
		paymentId: paymentRecord._id,
		editedBy: userIds.manager,
		editedByName: "Manager",
		editedByEmail: "manager@tioca.com",
		fieldName: "description",
		beforeValue: `Reservation payment for ${reservations[1].guestName}`,
		afterValue: `Reservation payment for ${reservations[1].guestName} - Guest satisfied with service, left 5-star review`,
		reason: "Documented guest feedback",
		createdAt: new Date("2026-01-05T14:45:00.000Z"),
	};
	paymentEdits.push(edit);
	db.paymentedits.insertOne(edit);
}

// ---- Edit 3: Manager marks test user's partial payment ----
{
	const paymentRecord = db.payments.findOne({
		stripePaymentIntentId: "pi_test_partial_001",
	});
	const edit = {
		paymentId: paymentRecord._id,
		editedBy: userIds.manager,
		editedByName: "Manager",
		editedByEmail: "manager@tioca.com",
		fieldName: "description",
		beforeValue: `Partial reservation payment for ${reservations[3].guestName}`,
		afterValue: `Partial reservation payment for ${reservations[3].guestName} - 50% deposit received, balance due at check-in`,
		reason: "Updated payment structure",
		createdAt: new Date("2026-01-08T10:00:00.000Z"),
	};
	paymentEdits.push(edit);
	db.paymentedits.insertOne(edit);
}

print("✓ Inserted payment edits:", paymentEdits.length);

// ============================================
// 6. SUMMARY REPORT
// ============================================

print("\n========================================");
print("✓ TEST DATA GENERATION COMPLETE");
print("========================================");

print("\n--- GOOGLE OAUTH USERS (3) ---");
print(
	"Email: keemkeem321@gmail.com | Name: Akeem Laurence | Provider ID: 101038855044083445001"
);
print(
	"Email: sarah.johnson.travel@gmail.com | Name: Sarah Johnson | Provider ID: 118527482956738291847"
);
print(
	"Email: james.chen.couples@gmail.com | Name: James Chen | Provider ID: 106439247629781234567"
);

print("\n--- LOCAL STRATEGY USERS (3) ---");
print("Email: manager@tioca.com | Password: password123 | Role: Manager");
print("Email: testuser@tioca.com | Password: password123 | Role: User");
print("Email: guest@tioca.com | Password: password123 | Role: User");

print("\n--- RESERVATIONS (6) ---");
print(
	"1. Akeem (Google) → Business Pod | Confirmed + Paid | " +
		d(5).toDateString() +
		" - " +
		d(8).toDateString()
);
print(
	"2. Sarah (Google) → Women-Only Pod | Checked-out + Paid | Past reservation"
);
print(
	"3. James (Google) → Couples Pod | Pending + Unpaid | " +
		d(14).toDateString() +
		" - " +
		d(16).toDateString()
);
print(
	"4. Test User (Local) → Men-Only Pod | Confirmed + Partial | " +
		d(10).toDateString() +
		" - " +
		d(13).toDateString()
);
print(
	"5. Guest User (Local) → Women-Only Pod | Cancelled + Refunded | " +
		d(25).toDateString() +
		" - " +
		d(28).toDateString()
);
print(
	"6. Akeem (Google) → Business Pod | Pending + Failed | " +
		d(30).toDateString() +
		" - " +
		d(32).toDateString()
);

print("\n--- PAYMENT STATUSES (6) ---");
print("✓ 2 Successful payments (Akeem, Sarah)");
print("✓ 1 Pending payment (James)");
print("✓ 1 Partial payment (Test User - 50%)");
print("✓ 1 Refunded payment (Guest User - full)");
print("✓ 1 Failed payment (Akeem - card declined)");

print("\n--- PAYMENT AUDITS (3) ---");
print("✓ 3 PaymentEdit records showing manager updates and notes");

print("\n--- USE FOR TESTING ---");
print("• Payments Management Page: All payment statuses included");
print("• Stripe Integration: Mock payment intents and charges");
print("• Google OAuth: Realistic provider IDs and timestamps");
print("• Payment Edits: Audit trail with manager notes");
print("• Edge Cases: Failed charges, partial payments, refunds");

print("\n✓ Ready to test Payments Management UI!");
