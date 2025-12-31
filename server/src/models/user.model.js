import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	provider: { type: String }, // e.g., 'google', 'facebook', 'local'
	providerId: { type: String }, // OAuth provider user ID
	name: { type: String },
	email: { type: String, required: true, unique: true },
	password: { type: String }, // Only for local users
	avatar: { type: String },
	createdAt: { type: Date, default: Date.now },
	lastLogin: { type: Date },
});

const User = mongoose.model("User", userSchema);

export default User;
