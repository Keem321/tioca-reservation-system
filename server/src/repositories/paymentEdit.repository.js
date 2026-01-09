import PaymentEdit from "../models/paymentEdit.model.js";

class PaymentEditRepository {
	/**
	 * Create a payment edit history record
	 * @param {Object} editData - Edit data
	 * @returns {Promise<Object>}
	 */
	async create(editData) {
		const edit = new PaymentEdit(editData);
		return await edit.save();
	}

	/**
	 * Find all edits for a payment
	 * @param {string} paymentId - Payment ID
	 * @returns {Promise<Array>}
	 */
	async findByPaymentId(paymentId) {
		return await PaymentEdit.find({ paymentId })
			.sort({ createdAt: -1 })
			.populate("editedBy", "name email");
	}

	/**
	 * Find all edits by editor
	 * @param {string} userId - User ID
	 * @returns {Promise<Array>}
	 */
	async findByEditor(userId) {
		return await PaymentEdit.find({ editedBy: userId })
			.sort({ createdAt: -1 })
			.populate("paymentId", "amount status");
	}

	/**
	 * Get edit history with pagination
	 * @param {string} paymentId - Payment ID
	 * @param {number} limit - Limit results
	 * @param {number} skip - Skip results
	 * @returns {Promise<Array>}
	 */
	async getHistory(paymentId, limit = 50, skip = 0) {
		return await PaymentEdit.find({ paymentId })
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.populate("editedBy", "name email");
	}

	/**
	 * Delete all edits for a payment
	 * @param {string} paymentId - Payment ID
	 * @returns {Promise<Object>}
	 */
	async deleteByPaymentId(paymentId) {
		return await PaymentEdit.deleteMany({ paymentId });
	}
}

export default new PaymentEditRepository();
