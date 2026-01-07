// MongoDB Playground file for TIOCA Reservation System - Test Users

use("tioca-reservation-system");

db.createCollection("users");

// Manager Account - Local Strategy
// Email: manager@tioca.com
// Password: password123
// Bcrypt hash (rounds: 10): $2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG
db.users.insertMany([
	{
		provider: "local",
		name: "Manager",
		email: "manager@tioca.com",
		password: "$2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG",
		role: "manager",
		lastLogin: null,
		createdAt: new Date(),
	},
]);
