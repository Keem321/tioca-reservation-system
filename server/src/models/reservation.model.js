import { Schema, model } from "mongoose";

const reservationSchema = new Schema(
	{
		roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
		guestName: { type: String, required: true },
		guestEmail: { type: String, required: true },
		guestPhone: { type: String },
		checkInDate: { type: Date, required: true },
		checkOutDate: { type: Date, required: true },
		numberOfGuests: { type: Number, required: true, min: 1 },

		// Pricing information (stored in cents)
		baseRoomPrice: { type: Number, required: true, min: 0 }, // Base price for room offering per night (in cents)
		selectedAmenities: [
			{
				offeringId: {
					type: Schema.Types.ObjectId,
					ref: "Offering",
				},
				name: { type: String },
				price: { type: Number, min: 0 }, // Price in cents
				priceType: {
					type: String,
					enum: ["per-night", "flat"],
				},
			},
		],
		numberOfNights: { type: Number, required: true, min: 1 },
		totalPrice: { type: Number, required: true, min: 0 }, // Total in cents

		status: {
			type: String,
			enum: ["pending", "confirmed", "checked-in", "checked-out", "cancelled"],
			default: "pending",
		},
		paymentStatus: {
			type: String,
			enum: ["unpaid", "partial", "paid", "refunded"],
			default: "unpaid",
		},
		// Stripe payment fields
		stripePaymentIntentId: { type: String },
		stripeChargeId: { type: String },
		stripeCustomerId: { type: String },
		specialRequests: { type: String },
		cancellationReason: { type: String },
		cancelledAt: { type: Date },
	},
	{ timestamps: true }
);

// Indexes for efficient querying
reservationSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1 });
reservationSchema.index({ userId: 1 });

export default model("Reservation", reservationSchema);
