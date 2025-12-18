import { Schema, model } from "mongoose";

const hotelSchema = new Schema(
	{
		name: { type: String, required: true },
		address: { type: String, required: true },
		phone: { type: String },
		category: { type: String, enum: ["hotel", "motel"], required: true },
		amenities: [{ type: String }],
		managerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
	},
	{ timestamps: true }
);

export default model("Hotel", hotelSchema);
