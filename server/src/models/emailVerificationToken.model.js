import { Schema, model } from "mongoose";

/**
 * EmailVerificationToken Schema
 * Used for guest reservation access verification
 */
const emailVerificationTokenSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		reservationId: {
			type: Schema.Types.ObjectId,
			ref: "Reservation",
			required: true,
		},
		token: {
			type: String,
			required: true,
			unique: true,
		},
		code: {
			type: String,
			required: true,
		},
		purpose: {
			type: String,
			enum: ["reservation_access", "email_change"],
			default: "reservation_access",
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		used: {
			type: Boolean,
			default: false,
		},
		usedAt: {
			type: Date,
		},
	},
	{ timestamps: true }
);

// Indexes for efficient querying
emailVerificationTokenSchema.index({ email: 1 });
emailVerificationTokenSchema.index({ token: 1 });
emailVerificationTokenSchema.index({ reservationId: 1 });
emailVerificationTokenSchema.index({ expiresAt: 1 }); // For cleanup of expired tokens

// Automatically delete expired tokens (MongoDB TTL index)
emailVerificationTokenSchema.index(
	{ expiresAt: 1 },
	{ expireAfterSeconds: 0 }
);

export default model("EmailVerificationToken", emailVerificationTokenSchema);
