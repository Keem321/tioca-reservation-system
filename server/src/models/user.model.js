import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	provider: { type: String }, // e.g., 'google', 'facebook', 'local'
	providerId: { type: String }, // OAuth provider user ID
	name: { type: String },
	email: { type: String, required: true, unique: true },
	password: { type: String }, // Only for local users
	role: {
		type: String,
		enum: ["user", "manager", "admin"],
		default: "user",
	},
	// Currency preference for displaying prices
	currencyPreference: {
		type: String,
		enum: ["USD", "JPY"],
		default: "USD",
	},
	createdAt: { type: Date, default: Date.now },
	lastLogin: { type: Date },
});

// Normalize missing roles on legacy users so auth responses always include a role
userSchema.pre("save", function assignDefaultRole() {
	if (!this.role) {
		this.role = "user";
	}
});

const User = mongoose.model("User", userSchema);

export default User;
