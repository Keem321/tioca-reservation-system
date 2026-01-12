import { Schema, model } from "mongoose";

/**
 * RoomHold Model
 * 
 * Represents a temporary hold on a room during the booking process.
 * Prevents overbooking by reserving a room while a user is on the 
 * confirmation or payment pages.
 * 
 * Holds expire automatically after a set duration, making the room
 * available again if the user abandons the booking process.
 */
const roomHoldSchema = new Schema(
	{
		roomId: { 
			type: Schema.Types.ObjectId, 
			ref: "Room", 
			required: true,
			index: true 
		},
		checkInDate: { 
			type: Date, 
			required: true 
		},
		checkOutDate: { 
			type: Date, 
			required: true 
		},
		sessionId: { 
			type: String, 
			required: true,
			index: true 
		},
		userId: { 
			type: Schema.Types.ObjectId, 
			ref: "User", 
			required: false 
		},
		holdExpiry: { 
			type: Date, 
			required: true
		},
		stage: {
			type: String,
			enum: ["confirmation", "payment"],
			default: "confirmation"
		},
		// Track if this hold was converted to a reservation
		converted: {
			type: Boolean,
			default: false
		},
		reservationId: {
			type: Schema.Types.ObjectId,
			ref: "Reservation",
			required: false
		}
	},
	{ timestamps: true }
);

// Compound index for efficient overlap checking
roomHoldSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1 });

// TTL index to automatically delete expired holds (cleanup every minute)
roomHoldSchema.index({ holdExpiry: 1 }, { expireAfterSeconds: 0 });

// Index for session-based queries
roomHoldSchema.index({ sessionId: 1, converted: 1 });

export default model("RoomHold", roomHoldSchema);
