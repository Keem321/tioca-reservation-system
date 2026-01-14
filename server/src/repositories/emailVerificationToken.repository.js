import EmailVerificationToken from "../models/emailVerificationToken.model.js";

class EmailVerificationTokenRepository {
	/**
	 * Create a new verification token
	 * @param {Object} tokenData - Token data
	 * @returns {Promise<Object>}
	 */
	async create(tokenData) {
		const token = new EmailVerificationToken(tokenData);
		return await token.save();
	}

	/**
	 * Find a token by token string
	 * @param {string} token - Token string
	 * @returns {Promise<Object|null>}
	 */
	async findByToken(token) {
		return await EmailVerificationToken.findOne({ token }).populate(
			"reservationId"
		);
	}

	/**
	 * Find active tokens by email and reservation
	 * @param {string} email - Email address
	 * @param {string} reservationId - Reservation ID (optional)
	 * @returns {Promise<Array>}
	 */
	async findActiveByEmailAndReservation(email, reservationId = null) {
		const query = {
			email: email.toLowerCase(),
			used: false,
			expiresAt: { $gt: new Date() },
		};

		// Only filter by reservationId if provided
		if (reservationId) {
			query.reservationId = reservationId;
		}

		return await EmailVerificationToken.find(query);
	}

	/**
	 * Find active tokens by email only (no reservationId filter)
	 * @param {string} email - Email address
	 * @returns {Promise<Array>}
	 */
	async findActiveByEmail(email) {
		return await EmailVerificationToken.find({
			email: email.toLowerCase(),
			used: false,
			expiresAt: { $gt: new Date() },
		}).populate("reservationId");
	}

	/**
	 * Mark a token as used
	 * @param {string} tokenId - Token ID
	 * @returns {Promise<Object|null>}
	 */
	async markAsUsed(tokenId) {
		return await EmailVerificationToken.findByIdAndUpdate(
			tokenId,
			{
				used: true,
				usedAt: new Date(),
			},
			{ new: true }
		);
	}

	/**
	 * Delete expired tokens (cleanup)
	 * @returns {Promise<Object>}
	 */
	async deleteExpired() {
		return await EmailVerificationToken.deleteMany({
			expiresAt: { $lt: new Date() },
		});
	}

	/**
	 * Count recent verification requests by email
	 * @param {string} email - Email address
	 * @param {number} minutes - Time window in minutes
	 * @returns {Promise<number>}
	 */
	async countRecentByEmail(email, minutes = 60) {
		const cutoff = new Date(Date.now() - minutes * 60 * 1000);
		return await EmailVerificationToken.countDocuments({
			email: email.toLowerCase(),
			createdAt: { $gte: cutoff },
		});
	}
}

export default new EmailVerificationTokenRepository();
