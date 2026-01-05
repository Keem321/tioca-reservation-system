import { Schema, model } from "mongoose";

const reservationSchema = new Schema(
	{
		hotelId: { type: Schema.Types.ObjectId, ref: "Hotel", required: true },
		roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		guestName: { type: String, required: true },
		guestEmail: { type: String, required: true },
		guestPhone: { type: String },
		checkInDate: { type: Date, required: true },
		checkOutDate: { type: Date, required: true },
		numberOfGuests: { type: Number, required: true, min: 1 },
		totalPrice: { type: Number, required: true, min: 0 },
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
		specialRequests: { type: String },
		cancellationReason: { type: String },
		cancelledAt: { type: Date },
	},
	{ timestamps: true }
);

// Indexes for efficient querying
reservationSchema.index({ hotelId: 1, status: 1 });
reservationSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1 });
reservationSchema.index({ userId: 1 });

export default model("Reservation", reservationSchema);
