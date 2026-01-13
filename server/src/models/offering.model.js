import { Schema, model } from "mongoose";

const offeringSchema = new Schema(
	{
		name: { type: String, required: true },
		type: {
			type: String,
			enum: ["room", "amenity"],
			required: true,
		},
		// Room-specific fields
		quality: {
			type: String,
			enum: [
				"classic", // Classic Pearl - Standard
				"milk", // Milk Pearl - Standard+
				"golden", // Golden Pearl - Premium
				"crystal", // Crystal Boba Suite - First Class
				"matcha", // Matcha Pearl - Women-Only Exclusive
			],
		},
		// Pricing fields (stored in cents for precision)
		basePrice: { type: Number, required: true, min: 0 }, // Price in cents
		currency: { type: String, default: "USD" },
		// Price modifier type
		priceType: {
			type: String,
			enum: ["per-night", "flat"],
			default: "per-night",
		},
		description: { type: String },
		// Display metadata for UI
		features: [{ type: String }], // List of features/amenities to display
		imageUrl: { type: String }, // URL to display image
		capacity: { type: String }, // e.g., "1 guest" or "2 guests"
		tag: { type: String }, // Optional tag like "Women Only" or "First Class"
		// For amenities: what floor this applies to (if any)
		applicableFloors: [
			{
				type: String,
				enum: ["women-only", "men-only", "couples", "business"],
			},
		],
		// For amenities: what room qualities this applies to
		applicableQualities: [
			{
				type: String,
				enum: ["classic", "milk", "golden", "crystal", "matcha"],
			},
		],
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

// Ensure room offerings are unique by quality (only for type=room)
// Using a compound index with sparse=true to only apply to documents with both fields
offeringSchema.index(
	{ type: 1, quality: 1 },
	{ unique: true, sparse: true, partialFilterExpression: { type: "room" } }
);

// Validate room offerings have quality
offeringSchema.pre("save", function (next) {
	if (this.type === "room" && !this.quality) {
		return next(new Error("Room offerings must have a quality level"));
	}
	if (this.type === "amenity" && this.quality) {
		return next(new Error("Amenity offerings should not have a quality level"));
	}
	next();
});

export default model("Offering", offeringSchema);
