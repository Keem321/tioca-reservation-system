// MongoDB Playground file for TIOCA Reservation System - Payment Analytics & Bulk Data
// Creates batch payment data for:
// - Dashboard analytics (revenue, conversion rates)
// - Date-range filtering tests
// - Payment status distribution
// - High-volume testing
// - Monthly revenue calculations

use("tioca-reservation-system");

print("========================================");
print("PAYMENT ANALYTICS & BULK DATA GENERATOR");
print("========================================\n");

// ============================================
// 1. RETRIEVE TEST DATA
// ============================================

// Get existing users
const akeemUser = db.users.findOne({ email: "keemkeem321@gmail.com" });
const sarahUser = db.users.findOne({ email: "sarah.johnson.travel@gmail.com" });
const jamesUser = db.users.findOne({ email: "james.chen.couples@gmail.com" });

// Get rooms
const menOnlyRoom = db.rooms.findOne({ floor: "men-only" });
const womenOnlyRoom = db.rooms.findOne({ floor: "women-only" });
const businessRoom = db.rooms.findOne({ floor: "business" });
const couplesRoom = db.rooms.findOne({ floor: "couples" });

if (!menOnlyRoom || !womenOnlyRoom || !businessRoom || !couplesRoom) {
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

// Generate random elements
function randomChoice(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
// 3. CREATE BULK HISTORICAL DATA
// ============================================

print("Creating bulk historical payment data (60 past days)...\n");

// Clear bulk data
db.reservations.deleteMany({
	specialRequests: { $regex: "bulk|historical" },
});

db.payments.deleteMany({
	stripePaymentIntentId: { $regex: "^pi_bulk|^pi_historical" },
});

const rooms = [menOnlyRoom, womenOnlyRoom, businessRoom, couplesRoom];
const users = [akeemUser, sarahUser, jamesUser];
const guestNames = [
	"Akeem Laurence",
	"Sarah Johnson",
	"James Chen",
	"Emily Rodriguez",
	"Michael Park",
	"Lisa Wong",
];
const guestEmails = [
	"akeem@example.com",
	"sarah@example.com",
	"james@example.com",
	"emily@example.com",
	"michael@example.com",
	"lisa@example.com",
];

const paymentStatuses = [
	"succeeded",
	"succeeded",
	"succeeded",
	"succeeded",
	"failed",
	"refunded",
	"processing",
];

let bulkReservationCount = 0;
let bulkPaymentCount = 0;
let totalBulkRevenue = 0;

// Generate 60 days of historical bookings
for (let dayOffset = -60; dayOffset <= -1; dayOffset++) {
	// Generate 3-5 bookings per day
	const bookingsPerDay = randomInt(3, 5);

	for (let i = 0; i < bookingsPerDay; i++) {
		const room = randomChoice(rooms);
		const user = randomChoice(users);
		const guestName = randomChoice(guestNames);
		const guestEmail = randomChoice(guestEmails);

		// Random stay length (1-7 nights)
		const stayLength = randomInt(1, 7);
		const checkIn = d(dayOffset);
		const checkOut = d(dayOffset + stayLength);
		const totalPrice = priceForStay(room, checkIn, checkOut);

		// Reservation
		const reservation = {
			roomId: room._id,
			userId: user?._id,
			guestName,
			guestEmail,
			guestPhone: `+81-90-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
			checkInDate: checkIn,
			checkOutDate: checkOut,
			numberOfGuests: room.floor === "couples" ? 2 : 1,
			totalPrice,
			status: randomChoice(["checked-out", "confirmed"]),
			paymentStatus: randomChoice([
				"paid",
				"partial",
				"paid",
				"paid",
				"refunded",
			]),
			stripeCustomerId: `cus_P1Bulk${bulkReservationCount}`,
			stripePaymentIntentId: `pi_bulk_hist_${bulkReservationCount}`,
			stripeChargeId: `ch_bulk_hist_${bulkReservationCount}`,
			specialRequests: "bulk: historical data for analytics",
			createdAt: new Date(d(dayOffset - randomInt(1, 7))),
			updatedAt: new Date(d(dayOffset + randomInt(0, 3))),
		};

		db.reservations.insertOne(reservation);

		// Corresponding payment
		const paymentAmount = Math.round(totalPrice * 100);
		const paymentStatus = randomChoice(paymentStatuses);

		const payment = {
			reservationId: reservation._id,
			userId: user?._id,
			amount: paymentAmount,
			currency: "usd",
			status: paymentStatus,
			stripePaymentIntentId: `pi_bulk_hist_${bulkReservationCount}`,
			stripeChargeId:
				paymentStatus === "failed"
					? null
					: `ch_bulk_hist_${bulkReservationCount}`,
			stripeCustomerId: `cus_P1Bulk${bulkReservationCount}`,
			refundAmount:
				paymentStatus === "refunded"
					? paymentAmount
					: paymentStatus === "partial"
					? Math.floor(paymentAmount * 0.3)
					: 0,
			refundStripeId:
				paymentStatus === "refunded"
					? `re_bulk_hist_${bulkReservationCount}`
					: null,
			failureReason:
				paymentStatus === "failed"
					? randomChoice(["Card declined", "Insufficient funds", "Lost card"])
					: null,
			failureCode:
				paymentStatus === "failed"
					? randomChoice(["card_declined", "insufficient_funds"])
					: null,
			description: `Bulk historical payment ${bulkReservationCount}`,
			receiptUrl:
				paymentStatus === "succeeded"
					? `https://receipts.stripe.com/acct_fake/bulk_${bulkReservationCount}`
					: null,
			createdAt: new Date(d(dayOffset)),
			updatedAt: new Date(d(dayOffset + randomInt(0, 2))),
		};

		db.payments.insertOne(payment);

		if (paymentStatus === "succeeded") {
			totalBulkRevenue += totalPrice;
		}

		bulkReservationCount++;
		bulkPaymentCount++;
	}
}

print(`✓ Created ${bulkReservationCount} bulk historical reservations`);
print(`✓ Created ${bulkPaymentCount} bulk historical payments`);
print(
	`✓ Total historical revenue: ¥${Math.round(
		totalBulkRevenue
	).toLocaleString()}\n`
);

// ============================================
// 4. MONTHLY BREAKDOWN DATA
// ============================================

print("Creating monthly payment summary data...\n");

const monthlyStats = {
	thisMonth: 0,
	lastMonth: 0,
	twoMonthsAgo: 0,
};

const monthlyBreakdown = db.payments
	.aggregate([
		{
			$match: {
				status: "succeeded",
				stripePaymentIntentId: { $regex: "^pi_bulk|^pi_scenario" },
			},
		},
		{
			$group: {
				_id: {
					year: { $year: "$createdAt" },
					month: { $month: "$createdAt" },
				},
				count: { $sum: 1 },
				totalAmount: { $sum: "$amount" },
			},
		},
		{
			$sort: { "_id.year": -1, "_id.month": -1 },
		},
	])
	.toArray();

print("--- MONTHLY PAYMENT STATISTICS ---");
monthlyBreakdown.forEach((month) => {
	const monthStr = new Date(
		month._id.year,
		month._id.month - 1
	).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
	});
	const amountInYen = (month.totalAmount / 100).toLocaleString();
	print(`${monthStr}: ${month.count} payments | ¥${amountInYen} revenue`);
});

// ============================================
// 5. PAYMENT STATUS DISTRIBUTION
// ============================================

print("\n--- PAYMENT STATUS DISTRIBUTION ---");

const statusDistribution = db.payments
	.aggregate([
		{
			$match: {
				stripePaymentIntentId: {
					$regex:
						"^pi_bulk|^pi_scenario|^pi_akeem|^pi_sarah|^pi_james|^pi_test|^pi_guest",
				},
			},
		},
		{
			$group: {
				_id: "$status",
				count: { $sum: 1 },
				totalAmount: { $sum: "$amount" },
				avgAmount: { $avg: "$amount" },
			},
		},
		{
			$sort: { count: -1 },
		},
	])
	.toArray();

statusDistribution.forEach((status) => {
	const amountInYen = (status.totalAmount / 100).toLocaleString();
	const avgInYen = (status.avgAmount / 100).toLocaleString();
	print(
		`${status._id.toUpperCase()}: ${
			status.count
		} payments | ¥${amountInYen} total | ¥${avgInYen} avg`
	);
});

// ============================================
// 6. REFUND ANALYSIS
// ============================================

print("\n--- REFUND ANALYSIS ---");

const refundStats = db.payments
	.aggregate([
		{
			$match: {
				refundAmount: { $gt: 0 },
				stripePaymentIntentId: {
					$regex: "^pi_bulk|^pi_scenario|^pi_guest",
				},
			},
		},
		{
			$group: {
				_id: null,
				count: { $sum: 1 },
				totalRefunded: { $sum: "$refundAmount" },
				avgRefund: { $avg: "$refundAmount" },
			},
		},
	])
	.toArray();

if (refundStats.length > 0) {
	const stats = refundStats[0];
	print(`Total refunds: ${stats.count} payments`);
	print(
		`Total refunded amount: ¥${(stats.totalRefunded / 100).toLocaleString()}`
	);
	print(`Average refund: ¥${(stats.avgRefund / 100).toLocaleString()}`);
} else {
	print("No refunds in current dataset");
}

// ============================================
// 7. FAILURE RATE ANALYSIS
// ============================================

print("\n--- FAILURE RATE ANALYSIS ---");

const totalPayments = db.payments.countDocuments({
	stripePaymentIntentId: {
		$regex:
			"^pi_bulk|^pi_scenario|^pi_akeem|^pi_sarah|^pi_james|^pi_test|^pi_guest",
	},
});

const failedPayments = db.payments.countDocuments({
	status: "failed",
	stripePaymentIntentId: {
		$regex:
			"^pi_bulk|^pi_scenario|^pi_akeem|^pi_sarah|^pi_james|^pi_test|^pi_guest",
	},
});

const failureRate =
	totalPayments > 0 ? ((failedPayments / totalPayments) * 100).toFixed(2) : 0;

print(`Total payments: ${totalPayments}`);
print(`Failed payments: ${failedPayments}`);
print(`Failure rate: ${failureRate}%`);

// ============================================
// 8. USER PAYMENT HISTORY
// ============================================

print("\n--- USER PAYMENT PATTERNS ---");

const userPaymentStats = db.payments
	.aggregate([
		{
			$match: {
				userId: { $exists: true, $ne: null },
				stripePaymentIntentId: {
					$regex:
						"^pi_bulk|^pi_scenario|^pi_akeem|^pi_sarah|^pi_james|^pi_test|^pi_guest",
				},
			},
		},
		{
			$group: {
				_id: "$userId",
				count: { $sum: 1 },
				totalSpent: { $sum: "$amount" },
				avgAmount: { $avg: "$amount" },
				successCount: {
					$sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] },
				},
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "_id",
				foreignField: "_id",
				as: "userInfo",
			},
		},
		{
			$unwind: {
				path: "$userInfo",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$sort: { totalSpent: -1 },
		},
		{
			$limit: 5,
		},
	])
	.toArray();

userPaymentStats.forEach((stat) => {
	const userName = stat.userInfo?.name || "Unknown";
	const totalInYen = (stat.totalSpent / 100).toLocaleString();
	const avgInYen = (stat.avgAmount / 100).toLocaleString();
	const successRate =
		stat.count > 0 ? ((stat.successCount / stat.count) * 100).toFixed(1) : 0;
	print(
		`${userName}: ${stat.count} payments | ¥${totalInYen} total | Success rate: ${successRate}%`
	);
});

// ============================================
// 9. SUMMARY REPORT
// ============================================

print("\n========================================");
print("✓ ANALYTICS DATA GENERATION COMPLETE");
print("========================================\n");

print("--- BULK DATA CREATED ---");
print(`✓ 60 days of historical reservations: ${bulkReservationCount}`);
print(`✓ Corresponding payments: ${bulkPaymentCount}`);
print(
	`✓ Total historical revenue: ¥${Math.round(
		totalBulkRevenue
	).toLocaleString()}`
);

print("\n--- COMBINED DATASET SUMMARY ---");
print(`✓ Total reservations: ${db.reservations.countDocuments()}`);
print(`✓ Total payments: ${db.payments.countDocuments()}`);
print(`✓ Total users: ${db.users.countDocuments()}`);
print(`✓ Total rooms: ${db.rooms.countDocuments()}`);

print("\n--- RECOMMENDED TESTING ---");
print("✓ Revenue dashboard: Filter by date range and status");
print("✓ Payment analytics: Monthly trends and user patterns");
print("✓ Failure analysis: View failed charges and retry paths");
print("✓ Refund management: Track partial and full refunds");
print("✓ Payment history: User-level transaction history");
print("✓ Export reports: CSV export of payment data");

print("\n✓ Full test dataset ready for Payments Management UI!");
