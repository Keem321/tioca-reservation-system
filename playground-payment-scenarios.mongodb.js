// MongoDB Playground file for TIOCA Reservation System - Advanced Payment Scenarios
// Creates comprehensive payment edge cases for testing the Payments Management page
// Includes:
// - Multiple payment intents for same reservation (retry scenarios)
// - Partial and overpayment scenarios
// - Processing and failed states
// - Refund scenarios (partial and full)
// - Payment history with updates
// - Large batch payments for analytics

use("tioca-reservation-system");

print("========================================");
print("ADVANCED PAYMENT SCENARIOS GENERATOR");
print("========================================\n");

// ============================================
// 1. GET EXISTING DATA
// ============================================

// Retrieve existing test users (from previous playground)
const akeemUser = db.users.findOne({ email: "keemkeem321@gmail.com" });
const sarahUser = db.users.findOne({ email: "sarah.johnson.travel@gmail.com" });
const jamesUser = db.users.findOne({ email: "james.chen.couples@gmail.com" });

if (!akeemUser || !sarahUser || !jamesUser) {
	print("⚠ Warning: Expected test users not found.");
	print("Run playground-users-and-payments.mongodb.js first.");
}

// Get rooms
const menOnlyRoom = db.rooms.findOne({ floor: "men-only" });
const businessRoom = db.rooms.findOne({ floor: "business" });
const couplesRoom = db.rooms.findOne({ floor: "couples" });

if (!menOnlyRoom || !businessRoom || !couplesRoom) {
	throw new Error("Rooms not found. Run playground-rooms.mongodb.js first.");
}

// ============================================
// 2. HELPER FUNCTIONS
// ============================================

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

// ============================================
// 3. CREATE ADVANCED RESERVATION SCENARIOS
// ============================================

print("Creating advanced reservation scenarios...\n");

// Clear scenario reservations
db.reservations.deleteMany({
	specialRequests: { $regex: "scenario|edge.case|retry|processing" },
});

// Clear scenario payments
db.payments.deleteMany({
	stripePaymentIntentId: {
		$regex: "^pi_scenario|^pi_edge|^pi_retry|^pi_processing",
	},
});

const scenarioReservations = [];

// ---- SCENARIO 1: Payment Retry (Failed → Succeeded) ----
// User's first card was declined, then they provided another card and it succeeded
{
	const checkIn = d(40);
	const checkOut = d(43);
	const totalPrice = priceForStay(businessRoom, checkIn, checkOut);
	const reservation = {
		roomId: businessRoom._id,
		userId: akeemUser?._id,
		guestName: "Akeem Laurence",
		guestEmail: "keemkeem321@gmail.com",
		guestPhone: "+81-90-1234-5678",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "confirmed",
		paymentStatus: "paid",
		stripeCustomerId: "cus_P1Akeem0002",
		stripePaymentIntentId: "pi_scenario_retry_success",
		stripeChargeId: "ch_scenario_retry_success",
		specialRequests: "edge.case: payment retry successful",
		createdAt: new Date("2026-01-08T17:00:00.000Z"),
		updatedAt: new Date("2026-01-08T17:45:00.000Z"),
	};
	const res = db.reservations.insertOne(reservation);
	scenarioReservations.push({ id: res.insertedId, reservation });
}

// ---- SCENARIO 2: Payment Processing (Long-running charge) ----
// Payment is still processing (unusual but possible with some payment methods)
{
	const checkIn = d(45);
	const checkOut = d(48);
	const totalPrice = priceForStay(couplesRoom, checkIn, checkOut);
	const reservation = {
		roomId: couplesRoom._id,
		userId: jamesUser?._id,
		guestName: "James Chen",
		guestEmail: "james.chen.couples@gmail.com",
		guestPhone: "+81-80-1111-2222",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 2,
		totalPrice,
		status: "pending",
		paymentStatus: "unpaid",
		stripeCustomerId: "cus_P1James0002",
		stripePaymentIntentId: "pi_scenario_processing_001",
		specialRequests: "scenario: payment still processing",
		createdAt: new Date("2026-01-08T19:00:00.000Z"),
		updatedAt: new Date("2026-01-08T19:00:00.000Z"),
	};
	const res = db.reservations.insertOne(reservation);
	scenarioReservations.push({ id: res.insertedId, reservation });
}

// ---- SCENARIO 3: Partial Refund (User modified reservation) ----
// Originally $800, now $600 after room downgrade, partial refund applied
{
	const checkIn = d(35);
	const checkOut = d(38);
	const totalPrice = priceForStay(menOnlyRoom, checkIn, checkOut);
	const originalPrice = totalPrice + 200; // Simulating price reduction
	const reservation = {
		roomId: menOnlyRoom._id,
		userId: sarahUser?._id,
		guestName: "Sarah Johnson",
		guestEmail: "sarah.johnson.travel@gmail.com",
		guestPhone: "+81-70-9876-5432",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice, // New reduced price
		status: "confirmed",
		paymentStatus: "paid",
		stripeCustomerId: "cus_P1Sarah0002",
		stripePaymentIntentId: "pi_scenario_partial_refund",
		stripeChargeId: "ch_scenario_partial_refund",
		specialRequests: "scenario: partial refund due to room change",
		createdAt: new Date("2026-01-06T12:00:00.000Z"),
		updatedAt: new Date("2026-01-08T14:30:00.000Z"),
	};
	const res = db.reservations.insertOne(reservation);
	scenarioReservations.push({ id: res.insertedId, reservation, originalPrice });
}

// ---- SCENARIO 4: Overpayment (Manual correction needed) ----
// Guest accidentally paid $1500 instead of $1200, needs resolution
{
	const checkIn = d(50);
	const checkOut = d(52);
	const totalPrice = priceForStay(businessRoom, checkIn, checkOut);
	const reservation = {
		roomId: businessRoom._id,
		userId: akeemUser?._id,
		guestName: "Akeem Laurence",
		guestEmail: "keemkeem321@gmail.com",
		guestPhone: "+81-90-1234-5678",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "confirmed",
		paymentStatus: "paid",
		stripeCustomerId: "cus_P1Akeem0002",
		stripePaymentIntentId: "pi_scenario_overpayment",
		stripeChargeId: "ch_scenario_overpayment",
		specialRequests: "scenario: overpayment by guest",
		createdAt: new Date("2026-01-08T11:00:00.000Z"),
		updatedAt: new Date("2026-01-08T11:30:00.000Z"),
	};
	const res = db.reservations.insertOne(reservation);
	scenarioReservations.push({ id: res.insertedId, reservation });
}

// ---- SCENARIO 5: Duplicate Payment Attempt ----
// Guest submitted form twice, two charges went through
{
	const checkIn = d(55);
	const checkOut = d(57);
	const totalPrice = priceForStay(couplesRoom, checkIn, checkOut);
	const reservation = {
		roomId: couplesRoom._id,
		userId: jamesUser?._id,
		guestName: "James Chen",
		guestEmail: "james.chen.couples@gmail.com",
		guestPhone: "+81-80-1111-2222",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 2,
		totalPrice,
		status: "confirmed",
		paymentStatus: "paid",
		stripeCustomerId: "cus_P1James0002",
		stripePaymentIntentId: "pi_scenario_duplicate_primary",
		stripeChargeId: "ch_scenario_duplicate_primary",
		specialRequests: "scenario: duplicate payment submitted",
		createdAt: new Date("2026-01-07T15:00:00.000Z"),
		updatedAt: new Date("2026-01-07T15:30:00.000Z"),
	};
	const res = db.reservations.insertOne(reservation);
	scenarioReservations.push({ id: res.insertedId, reservation });
}

// ---- SCENARIO 6: Failed Charge - Insufficient Funds ----
// Card has insufficient funds
{
	const checkIn = d(60);
	const checkOut = d(63);
	const totalPrice = priceForStay(businessRoom, checkIn, checkOut);
	const reservation = {
		roomId: businessRoom._id,
		userId: sarahUser?._id,
		guestName: "Sarah Johnson",
		guestEmail: "sarah.johnson.travel@gmail.com",
		guestPhone: "+81-70-9876-5432",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "pending",
		paymentStatus: "unpaid",
		stripeCustomerId: "cus_P1Sarah0002",
		stripePaymentIntentId: "pi_scenario_insufficient_funds",
		specialRequests: "scenario: insufficient funds error",
		createdAt: new Date("2026-01-08T13:15:00.000Z"),
		updatedAt: new Date("2026-01-08T13:15:00.000Z"),
	};
	const res = db.reservations.insertOne(reservation);
	scenarioReservations.push({ id: res.insertedId, reservation });
}

// ---- SCENARIO 7: Fraud Hold Released ----
// Payment was on fraud hold, now released
{
	const checkIn = d(65);
	const checkOut = d(68);
	const totalPrice = priceForStay(menOnlyRoom, checkIn, checkOut);
	const reservation = {
		roomId: menOnlyRoom._id,
		userId: akeemUser?._id,
		guestName: "Akeem Laurence",
		guestEmail: "keemkeem321@gmail.com",
		guestPhone: "+81-90-1234-5678",
		checkInDate: checkIn,
		checkOutDate: checkOut,
		numberOfGuests: 1,
		totalPrice,
		status: "confirmed",
		paymentStatus: "paid",
		stripeCustomerId: "cus_P1Akeem0002",
		stripePaymentIntentId: "pi_scenario_fraud_hold_released",
		stripeChargeId: "ch_scenario_fraud_released",
		specialRequests: "scenario: fraud hold released",
		createdAt: new Date("2026-01-05T10:00:00.000Z"),
		updatedAt: new Date("2026-01-08T16:00:00.000Z"),
	};
	const res = db.reservations.insertOne(reservation);
	scenarioReservations.push({ id: res.insertedId, reservation });
}

print(
	`✓ Created ${scenarioReservations.length} advanced scenario reservations\n`
);

// ============================================
// 4. CREATE CORRESPONDING PAYMENT RECORDS
// ============================================

print("Creating corresponding payment records...\n");

const scenarioPayments = [];

// ---- SCENARIO 1 PAYMENTS: Retry (1st failed, 2nd succeeded) ----
{
	const totalAmount = Math.round(
		scenarioReservations[0].reservation.totalPrice * 100
	);
	const resId = scenarioReservations[0].id;

	// First attempt - failed
	db.payments.insertOne({
		reservationId: resId,
		userId: akeemUser?._id,
		amount: totalAmount,
		currency: "usd",
		status: "failed",
		stripePaymentIntentId: "pi_scenario_retry_failed_first",
		stripeChargeId: null,
		stripeCustomerId: "cus_P1Akeem0002",
		refundAmount: 0,
		failureReason: "Your card was declined",
		failureCode: "card_declined",
		description: "First attempt - card declined",
		receiptUrl: null,
		createdAt: new Date("2026-01-08T17:00:00.000Z"),
		updatedAt: new Date("2026-01-08T17:00:00.000Z"),
	});

	// Second attempt - succeeded
	db.payments.insertOne({
		reservationId: resId,
		userId: akeemUser?._id,
		amount: totalAmount,
		currency: "usd",
		status: "succeeded",
		stripePaymentIntentId: "pi_scenario_retry_success",
		stripeChargeId: "ch_scenario_retry_success",
		stripeCustomerId: "cus_P1Akeem0002",
		refundAmount: 0,
		failureReason: null,
		failureCode: null,
		description: "Retry successful with different card",
		receiptUrl: "https://receipts.stripe.com/acct_fake/retry_success",
		createdAt: new Date("2026-01-08T17:20:00.000Z"),
		updatedAt: new Date("2026-01-08T17:45:00.000Z"),
	});

	scenarioPayments.push("Retry: 1 failed + 1 succeeded");
}

// ---- SCENARIO 2 PAYMENT: Processing ----
{
	const totalAmount = Math.round(
		scenarioReservations[1].reservation.totalPrice * 100
	);
	const resId = scenarioReservations[1].id;

	db.payments.insertOne({
		reservationId: resId,
		userId: jamesUser?._id,
		amount: totalAmount,
		currency: "usd",
		status: "processing",
		stripePaymentIntentId: "pi_scenario_processing_001",
		stripeChargeId: null,
		stripeCustomerId: "cus_P1James0002",
		refundAmount: 0,
		failureReason: null,
		failureCode: null,
		description: "Payment processing - wire transfer method",
		receiptUrl: null,
		createdAt: new Date("2026-01-08T19:00:00.000Z"),
		updatedAt: new Date("2026-01-08T19:00:00.000Z"),
	});

	scenarioPayments.push("Processing: 1 processing");
}

// ---- SCENARIO 3 PAYMENT: Partial Refund ----
{
	const totalAmount = Math.round(
		scenarioReservations[2].reservation.totalPrice * 100
	);
	const originalAmount = Math.round(
		scenarioReservations[2].originalPrice * 100
	);
	const refundAmount = originalAmount - totalAmount;
	const resId = scenarioReservations[2].id;

	db.payments.insertOne({
		reservationId: resId,
		userId: sarahUser?._id,
		amount: originalAmount,
		currency: "usd",
		status: "succeeded",
		stripePaymentIntentId: "pi_scenario_partial_refund",
		stripeChargeId: "ch_scenario_partial_refund",
		stripeCustomerId: "cus_P1Sarah0002",
		refundAmount: refundAmount,
		refundStripeId: "re_scenario_partial_refund_001",
		failureReason: null,
		failureCode: null,
		description: `Original charge, partial refund for room downgrade (${
			refundAmount / 100
		} yen)`,
		receiptUrl: "https://receipts.stripe.com/acct_fake/partial_refund",
		createdAt: new Date("2026-01-06T12:00:00.000Z"),
		updatedAt: new Date("2026-01-08T14:30:00.000Z"),
	});

	scenarioPayments.push("Partial Refund: 1 charge with partial refund");
}

// ---- SCENARIO 4 PAYMENT: Overpayment ----
{
	const totalAmount = Math.round(
		scenarioReservations[3].reservation.totalPrice * 100
	);
	const overpaymentAmount = Math.floor(totalAmount * 1.25); // 25% over
	const resId = scenarioReservations[3].id;

	db.payments.insertOne({
		reservationId: resId,
		userId: akeemUser?._id,
		amount: overpaymentAmount,
		currency: "usd",
		status: "succeeded",
		stripePaymentIntentId: "pi_scenario_overpayment",
		stripeChargeId: "ch_scenario_overpayment",
		stripeCustomerId: "cus_P1Akeem0002",
		refundAmount: 0, // Needs manager decision
		failureReason: null,
		failureCode: null,
		description: `Overpayment charged: ${
			overpaymentAmount / 100
		} yen (expected: ${totalAmount / 100})`,
		receiptUrl: "https://receipts.stripe.com/acct_fake/overpayment",
		createdAt: new Date("2026-01-08T11:00:00.000Z"),
		updatedAt: new Date("2026-01-08T11:30:00.000Z"),
	});

	scenarioPayments.push("Overpayment: 1 overpayment charge");
}

// ---- SCENARIO 5 PAYMENTS: Duplicate Charges ----
{
	const totalAmount = Math.round(
		scenarioReservations[4].reservation.totalPrice * 100
	);
	const resId = scenarioReservations[4].id;

	// Charge 1
	db.payments.insertOne({
		reservationId: resId,
		userId: jamesUser?._id,
		amount: totalAmount,
		currency: "usd",
		status: "succeeded",
		stripePaymentIntentId: "pi_scenario_duplicate_primary",
		stripeChargeId: "ch_scenario_duplicate_primary",
		stripeCustomerId: "cus_P1James0002",
		refundAmount: 0,
		failureReason: null,
		failureCode: null,
		description: "First charge (legitimate)",
		receiptUrl: "https://receipts.stripe.com/acct_fake/dup_1",
		createdAt: new Date("2026-01-07T15:00:00.000Z"),
		updatedAt: new Date("2026-01-07T15:30:00.000Z"),
	});

	// Charge 2 - duplicate (should be refunded)
	db.payments.insertOne({
		reservationId: resId,
		userId: jamesUser?._id,
		amount: totalAmount,
		currency: "usd",
		status: "refunded",
		stripePaymentIntentId: "pi_scenario_duplicate_secondary",
		stripeChargeId: "ch_scenario_duplicate_secondary",
		stripeCustomerId: "cus_P1James0002",
		refundAmount: totalAmount,
		refundStripeId: "re_scenario_duplicate_full_refund",
		failureReason: null,
		failureCode: null,
		description: "Duplicate charge - full refund issued",
		receiptUrl: null,
		createdAt: new Date("2026-01-07T15:01:00.000Z"),
		updatedAt: new Date("2026-01-08T10:00:00.000Z"),
	});

	scenarioPayments.push("Duplicate: 1 succeeded + 1 refunded");
}

// ---- SCENARIO 6 PAYMENT: Failed - Insufficient Funds ----
{
	const totalAmount = Math.round(
		scenarioReservations[5].reservation.totalPrice * 100
	);
	const resId = scenarioReservations[5].id;

	db.payments.insertOne({
		reservationId: resId,
		userId: sarahUser?._id,
		amount: totalAmount,
		currency: "usd",
		status: "failed",
		stripePaymentIntentId: "pi_scenario_insufficient_funds",
		stripeChargeId: null,
		stripeCustomerId: "cus_P1Sarah0002",
		refundAmount: 0,
		failureReason: "Insufficient funds",
		failureCode: "insufficient_funds",
		description: "Card has insufficient funds",
		receiptUrl: null,
		createdAt: new Date("2026-01-08T13:15:00.000Z"),
		updatedAt: new Date("2026-01-08T13:15:00.000Z"),
	});

	scenarioPayments.push("Failed Charge: 1 insufficient funds");
}

// ---- SCENARIO 7 PAYMENT: Fraud Hold Released ----
{
	const totalAmount = Math.round(
		scenarioReservations[6].reservation.totalPrice * 100
	);
	const resId = scenarioReservations[6].id;

	db.payments.insertOne({
		reservationId: resId,
		userId: akeemUser?._id,
		amount: totalAmount,
		currency: "usd",
		status: "succeeded",
		stripePaymentIntentId: "pi_scenario_fraud_hold_released",
		stripeChargeId: "ch_scenario_fraud_released",
		stripeCustomerId: "cus_P1Akeem0002",
		refundAmount: 0,
		failureReason: null,
		failureCode: null,
		description: "Charge released from fraud hold - verified by customer",
		receiptUrl: "https://receipts.stripe.com/acct_fake/fraud_released",
		createdAt: new Date("2026-01-05T10:00:00.000Z"),
		updatedAt: new Date("2026-01-08T16:00:00.000Z"),
	});

	scenarioPayments.push("Fraud Hold: 1 charge released");
}

print(`✓ Created payment records for all scenarios\n`);

// ============================================
// 5. CREATE PAYMENT EDIT RECORDS FOR SCENARIOS
// ============================================

print("Creating payment edit records for scenarios...\n");

// Get manager user
const manager = db.users.findOne({ email: "manager@tioca.com" });

if (manager) {
	// Edit for retry scenario
	{
		const payment = db.payments.findOne({
			stripePaymentIntentId: "pi_scenario_retry_success",
		});
		db.paymentedits.insertOne({
			paymentId: payment._id,
			editedBy: manager._id,
			editedByName: "Manager",
			editedByEmail: "manager@tioca.com",
			fieldName: "description",
			beforeValue: "Retry successful with different card",
			afterValue:
				"Retry successful with different card - Guest called after first attempt failed",
			reason: "Documented customer service interaction",
			createdAt: new Date("2026-01-08T17:50:00.000Z"),
		});
	}

	// Edit for partial refund
	{
		const payment = db.payments.findOne({
			stripePaymentIntentId: "pi_scenario_partial_refund",
		});
		db.paymentedits.insertOne({
			paymentId: payment._id,
			editedBy: manager._id,
			editedByName: "Manager",
			editedByEmail: "manager@tioca.com",
			fieldName: "description",
			beforeValue:
				"Original charge, partial refund for room downgrade (20000 yen)",
			afterValue:
				"Original charge, partial refund for room downgrade (20000 yen) - Guest requested Women-Only floor instead of Business",
			reason: "Updated for room preference documentation",
			createdAt: new Date("2026-01-08T14:45:00.000Z"),
		});
	}

	// Edit for overpayment
	{
		const payment = db.payments.findOne({
			stripePaymentIntentId: "pi_scenario_overpayment",
		});
		db.paymentedits.insertOne({
			paymentId: payment._id,
			editedBy: manager._id,
			editedByName: "Manager",
			editedByEmail: "manager@tioca.com",
			fieldName: "description",
			beforeValue:
				"Overpayment charged: 37500 yen (expected: 30000) - Needs manager decision",
			afterValue:
				"Overpayment charged: 37500 yen (expected: 30000) - Refund decision pending - waiting for guest contact",
			reason: "Marked as pending review",
			createdAt: new Date("2026-01-08T11:45:00.000Z"),
		});
	}

	// Edit for duplicate charges
	{
		const payment = db.payments.findOne({
			stripePaymentIntentId: "pi_scenario_duplicate_secondary",
		});
		db.paymentedits.insertOne({
			paymentId: payment._id,
			editedBy: manager._id,
			editedByName: "Manager",
			editedByEmail: "manager@tioca.com",
			fieldName: "description",
			beforeValue: "Duplicate charge - full refund issued",
			afterValue:
				"Duplicate charge - full refund issued via Stripe - Guest notified of duplicate charge",
			reason: "Documented resolution",
			createdAt: new Date("2026-01-08T10:15:00.000Z"),
		});
	}

	print("✓ Created payment edit records with manager notes\n");
}

// ============================================
// 6. SUMMARY REPORT
// ============================================

print("========================================");
print("✓ ADVANCED SCENARIOS COMPLETE");
print("========================================\n");

print("--- SCENARIO RESERVATIONS (7) ---");
print("1. Payment Retry: Failed card → Success with new card");
print("2. Payment Processing: Wire transfer (long-running)");
print("3. Partial Refund: Room downgrade refund issued");
print("4. Overpayment: Guest paid 125% of reservation");
print("5. Duplicate Charges: Double-charged, second refunded");
print("6. Failed Charge: Insufficient funds on card");
print("7. Fraud Hold Released: Charge held & released by bank");

print("\n--- PAYMENT TOTALS BY STATUS ---");
print("✓ Succeeded: 6 payments");
print("✓ Failed: 2 payments");
print("✓ Processing: 1 payment");
print("✓ Refunded: 1 payment (duplicate secondary)");
print("✓ Total: 10 payment records");

print("\n--- REFUND SCENARIOS ---");
print("✓ Partial Refund: 20000 yen (room downgrade)");
print("✓ Full Refund: Duplicate charge reversal");
print("✓ Pending Refund: Overpayment decision");

print("\n--- PAYMENT EDITS (4) ---");
print("✓ Manager notes for key scenarios");
print("✓ Audit trail for customer service interactions");

print("\n✓ Ready for advanced Payments Management UI testing!");
print("✓ Test scenarios cover:");
print("  - Retry logic and error recovery");
print("  - Partial and full refunds");
print("  - Fraud detection workflows");
print("  - Duplicate payment handling");
print("  - Manual refund decisions");
