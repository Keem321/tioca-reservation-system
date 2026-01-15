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
		// Detailed Reservation Information (snapshot at time of payment)
		reservationDetails: {
			checkInDate: { type: Date },
			checkOutDate: { type: Date },
			numberOfNights: { type: Number, min: 0 },
			numberOfGuests: { type: Number, min: 1 },
			guestName: { type: String },
			guestEmail: { type: String },
			guestPhone: { type: String },
			// Pod/Room information
			rooms: [
				{
					roomId: { type: Schema.Types.ObjectId, ref: "Room" },
					podId: { type: String },
					quality: { type: String },
					floor: { type: String },
					basePrice: { type: Number, min: 0 }, // Price per night in cents
				},
			],
			// Amenities booked
			selectedAmenities: [
				{
					offeringId: { type: Schema.Types.ObjectId, ref: "Offering" },
					name: { type: String },
					price: { type: Number, min: 0 }, // Price in cents
					priceType: { type: String, enum: ["per-night", "flat"] },
					totalPrice: { type: Number, min: 0 }, // Calculated total in cents
				},
			],
			// Price breakdown
			priceBreakdown: {
				baseRoomTotal: { type: Number, min: 0 }, // Base room price × nights in cents
				amenitiesTotal: { type: Number, min: 0 }, // Sum of all amenities in cents
				subtotal: { type: Number, min: 0 }, // Subtotal in cents
				taxes: { type: Number, default: 0, min: 0 }, // Taxes in cents
				discounts: { type: Number, default: 0, min: 0 }, // Discounts in cents
				total: { type: Number, min: 0 }, // Final total in cents
			},
			specialRequests: { type: String },
		},
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
