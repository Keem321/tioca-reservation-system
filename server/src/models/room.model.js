import { Schema, model } from "mongoose";

const roomSchema = new Schema(
	{
		podId: { type: String, required: true }, // User-friendly identifier: e.g., "301" for Floor 3, Pod 1
		roomNumber: { type: String }, // Legacy field (deprecated, use podId instead)
		quality: {
			type: String,
			enum: [
				"classic", // Classic Pearl - Standard
				"milk", // Milk Pearl - Standard+
				"golden", // Golden Pearl - Premium
				"crystal", // Crystal Boba Suite - First Class
				"matcha", // Matcha Pearl - Women-Only Exclusive
			],
			required: true,
		},
		floor: {
			type: String,
			enum: ["women-only", "men-only", "couples", "business"],
			required: true,
		},
		pricePerNight: { type: Number, required: true, min: 0 },
		description: { type: String },
		dimensions: {
			length: { type: Number }, // in inches
			width: { type: Number }, // in inches
			height: { type: Number }, // in inches
		},
		amenities: [{ type: String }],
		images: [{ type: String }],
		status: {
			type: String,
			enum: ["available", "occupied", "maintenance", "reserved"],
			default: "available",
		},
	},
	{ timestamps: true }
);

// podId must be globally unique
roomSchema.index({ podId: 1 }, { unique: true });

// Virtual getter for capacity: 2 for couples floor, 1 for all others
roomSchema.virtual("capacity").get(function () {
	return this.floor === "couples" ? 2 : 1;
});

// Validation: Matcha quality can only be on women-only floor
// Also set default dimensions based on quality level if not provided
roomSchema.pre("save", function (next) {
	if (this.quality === "matcha" && this.floor !== "women-only") {
		return next(
			new Error("Matcha Pearl quality is exclusive to women-only floor")
		);
	}

	// Set default dimensions based on quality if not provided
	if (!this.dimensions || !this.dimensions.length) {
		const qualityDimensions = {
			classic: { length: 80, width: 40, height: 40 },
			milk: { length: 84, width: 42, height: 45 },
			golden: { length: 86, width: 45, height: 50 },
			crystal: { length: 90, width: 55, height: 65 },
			matcha: { length: 86, width: 45, height: 50 },
		};
		this.dimensions = qualityDimensions[this.quality];
	}

	next();
});

export default model("Room", roomSchema);
