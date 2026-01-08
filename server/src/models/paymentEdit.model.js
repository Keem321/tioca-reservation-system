import mongoose from "mongoose";

const PaymentEditSchema = new mongoose.Schema(
	{
		paymentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Payment",
			required: true,
			index: true,
		},
		editedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		editedByName: {
			type: String,
			required: true,
		},
		editedByEmail: {
			type: String,
			required: true,
		},
		fieldName: {
			type: String,
			required: true,
			enum: ["description", "metadata"],
		},
		beforeValue: mongoose.Schema.Types.Mixed,
		afterValue: mongoose.Schema.Types.Mixed,
		reason: {
			type: String,
			default: null,
		},
		createdAt: {
			type: Date,
			default: Date.now,
			index: true,
		},
	},
	{ timestamps: false }
);

// Compound index for efficient querying by payment and date
PaymentEditSchema.index({ paymentId: 1, createdAt: -1 });

export default mongoose.model("PaymentEdit", PaymentEditSchema);
