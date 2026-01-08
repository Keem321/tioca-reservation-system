import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
	{
		reservationId: {
			type: Schema.Types.ObjectId,
			ref: "Reservation",
			required: true,
		},
		userId: { type: Schema.Types.ObjectId, ref: "User" }, // Optional, may be null for guest bookings
		amount: { type: Number, required: true, min: 0 }, // Amount in cents
		currency: { type: String, default: "usd" },
		status: {
			type: String,
			enum: ["pending", "processing", "succeeded", "failed", "refunded"],
			default: "pending",
		},
		// Stripe identifiers
		stripePaymentIntentId: { type: String },
		stripeChargeId: { type: String },
		stripeCustomerId: { type: String },
		// Refund tracking
		refundAmount: { type: Number, default: 0 }, // Amount in cents
		refundStripeId: { type: String },
		// Error tracking
		failureReason: { type: String },
		failureCode: { type: String },
		// Metadata
		description: { type: String },
		receiptUrl: { type: String },
	},
	{ timestamps: true }
);

// Indexes for efficient querying
paymentSchema.index({ reservationId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

export default model("Payment", paymentSchema);
