// MongoDB Playground file for TIOCA Reservation System - Test Reservations
// Seeds realistic reservations using existing rooms in the database.
// Creates test users and bookings for testing booking availability and payment UI
//
// Notes:
// - Creates test users if they don't exist
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

// Create or fetch test users
const testUserEmail = "testuser@tioca.com";
const testUser2Email = "guest@tioca.com";

// Check if test users exist, create if they don't
let testUser = db.users.findOne({ email: testUserEmail });
if (!testUser) {
  db.users.insertOne({
    email: testUserEmail,
    password: "$2b$10$dummyhashedpasswordfortesting123456", // Dummy hash
    name: "Test User",
    role: "guest",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  testUser = db.users.findOne({ email: testUserEmail });
  print(`Created test user: ${testUserEmail}`);
}

let testUser2 = db.users.findOne({ email: testUser2Email });
if (!testUser2) {
  db.users.insertOne({
    email: testUser2Email,
    password: "$2b$10$dummyhashedpasswordfortesting123456", // Dummy hash
    name: "Guest User",
    role: "guest",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  testUser2 = db.users.findOne({ email: testUser2Email });
  print(`Created test user: ${testUser2Email}`);
}

// Select real rooms from each floor for variety
const menOnlyRoom = db.rooms.find({ floor: "men-only" }).limit(1).toArray()[0];
const businessRoom = db.rooms.find({ floor: "business" }).limit(1).toArray()[0];
const couplesRoom = db.rooms.find({ floor: "couples" }).limit(1).toArray()[0];

if (!menOnlyRoom || !businessRoom || !couplesRoom) {
  throw new Error(
    "Insufficient rooms found. Ensure rooms collection has rooms for men-only, business, and couples floors."
  );
}

// Dates helper
const today = new Date();
const d = (offset) =>
  new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + offset
  );

// Build reservations
const reservations = [];

// Test User 1 - upcoming active reservation (men-only)
{
  const checkIn = d(7); // 1 week from now
  const checkOut = d(10); // 3 nights
  reservations.push({
    roomId: menOnlyRoom._id,
    userId: testUser._id,
    guestName: testUser.name,
    guestEmail: testUser.email,
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

// Test User 1 - past completed reservation (business)
{
  const checkIn = d(-30);
  const checkOut = d(-27); // 3 nights past
  reservations.push({
    roomId: businessRoom._id,
    userId: testUser._id,
    guestName: testUser.name,
    guestEmail: testUser.email,
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

// Test User 2 - upcoming active reservation (business)
{
  const checkIn = d(2);
  const checkOut = d(5); // 3 nights
  reservations.push({
    roomId: businessRoom._id,
    userId: testUser2._id,
    guestName: testUser2.name,
    guestEmail: testUser2.email,
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

// Test User 2 - upcoming couples reservation (2 guests)
{
  const checkIn = d(12);
  const checkOut = d(14); // 2 nights
  reservations.push({
    roomId: couplesRoom._id,
    userId: testUser2._id,
    guestName: testUser2.name,
    guestEmail: testUser2.email,
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

// Test User 1 - pending payment reservation (for testing payment UI)
{
  const checkIn = d(20);
  const checkOut = d(22); // 2 nights
  reservations.push({
    roomId: menOnlyRoom._id,
    userId: testUser._id,
    guestName: testUser.name,
    guestEmail: testUser.email,
    numberOfGuests: 1,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    totalPrice: priceForStay(menOnlyRoom, checkIn, checkOut),
    status: "pending",
    paymentStatus: "pending",
    specialRequests: "Testing payment flow",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// Clean up existing test reservations to avoid duplicates
const testUserIds = [testUser._id, testUser2._id];
db.reservations.deleteMany({
  userId: { $in: testUserIds },
});

// Insert new test reservations
if (reservations.length > 0) {
  db.reservations.insertMany(reservations);
  print(`Inserted ${reservations.length} reservations for test users.`);
  print("\n=== Test Accounts ===");
  print(`Email: ${testUserEmail} / Password: password123`);
  print(`Email: ${testUser2Email} / Password: password123`);
  print("\n=== Reservations Created ===");
  print(
    `${testUser.name} - Upcoming: Pod ${menOnlyRoom.podId}, ${d(7).toDateString()} - ${d(10).toDateString()}`
  );
  print(
    `${testUser.name} - Past: Pod ${businessRoom.podId}, ${d(-30).toDateString()} - ${d(-27).toDateString()}`
  );
  print(
    `${testUser.name} - Pending Payment: Pod ${menOnlyRoom.podId}, ${d(20).toDateString()} - ${d(22).toDateString()}`
  );
  print(
    `${testUser2.name} - Upcoming: Pod ${businessRoom.podId}, ${d(2).toDateString()} - ${d(5).toDateString()}`
  );
  print(
    `${testUser2.name} - Couples: Pod ${couplesRoom.podId}, ${d(12).toDateString()} - ${d(14).toDateString()}`
  );
} else {
  print("No reservations prepared. Check room queries.");
}