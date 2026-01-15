// MongoDB Playground - Add both Manager and Admin users
use("tioca-reservation-system");

// Manager Account
// Email: manager@tioca.com
// Password: password123
db.users.insertOne({
    provider: "local",
    name: "Manager User",
    email: "manager@tioca.com",
    password: "$2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG",
    role: "manager",
    lastLogin: null,
    createdAt: new Date(),
});

// Admin Account  
// Email: admin@tioca.com
// Password: password123 (same hash works for same password)
db.users.insertOne({
    provider: "local",
    name: "Admin User",
    email: "admin@tioca.com",
    password: "$2b$10$iJ4huoe9kD0T7m7isZY1xeCeS0i.cD7huirVn6loP2CK1i/XgvcbG",
    role: "admin",
    lastLogin: null,
    createdAt: new Date(),
});