import { Schema, model } from "mongoose";

const roomSchema = new Schema(
	{
		hotelId: { type: Schema.Types.ObjectId, ref: "Hotel", required: true },
		roomNumber: { type: String, required: true },
		roomType: {
			type: String,
			enum: ["single", "double", "suite", "deluxe", "executive"],
			required: true,
		},
		capacity: { type: Number, required: true, min: 1 },
		pricePerNight: { type: Number, required: true, min: 0 },
		description: { type: String },
		amenities: [{ type: String }],
		images: [{ type: String }],
		status: {
			type: String,
			enum: ["available", "occupied", "maintenance", "reserved"],
			default: "available",
		},
		floor: { type: Number },
		size: { type: Number }, // in square feet/meters
	},
	{ timestamps: true }
);

// Compound index to ensure unique room numbers per hotel
roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

export default model("Room", roomSchema);
