import ReservationRepository from "../repositories/reservation.repository.js";
import EmailVerificationTokenRepository from "../repositories/emailVerificationToken.repository.js";
import EmailService from "./email.service.js";

class ReservationVerificationService {
	/**
	 * Request access to a reservation (for guests without accounts)
	 * @param {string} email - Guest email
	 * @param {string} confirmationCode - Reservation confirmation code
	 * @returns {Promise<Object>}
	 */
	async requestReservationAccess(email, confirmationCode) {
		// Find reservation by confirmation code and email
		const reservation = await ReservationRepository.findByConfirmationCode(
			confirmationCode
		);

		if (!reservation) {
			throw new Error("Reservation not found");
		}

		// Verify email matches
		if (reservation.guestEmail.toLowerCase() !== email.toLowerCase()) {
			throw new Error("Email does not match reservation");
		}

		// Check if reservation is cancelled
		if (reservation.status === "cancelled") {
			throw new Error("This reservation has been cancelled");
		}

		// Rate limiting: Check if too many requests from this email
		const recentCount = await EmailVerificationTokenRepository.countRecentByEmail(
			email,
			60 // Last 60 minutes
		);

		if (recentCount >= 5) {
			throw new Error(
				"Too many verification requests. Please try again later."
			);
		}

		// Send verification email
		const result = await EmailService.sendReservationVerification(reservation);

		return {
			success: true,
			message: "Verification email sent. Please check your inbox.",
			expiresInMinutes: 15,
		};
	}

	/**
	 * Verify token and get reservation details
	 * @param {string} token - Verification token
	 * @returns {Promise<Object>}
	 */
	async verifyTokenAndGetReservation(token) {
		// Find token
		const verificationToken = await EmailVerificationTokenRepository.findByToken(
			token
		);

		if (!verificationToken) {
			throw new Error("Invalid verification link");
		}

		// Check if already used
		if (verificationToken.used) {
			throw new Error("This verification link has already been used");
		}

		// Check if expired
		if (new Date() > verificationToken.expiresAt) {
			throw new Error("Verification link has expired");
		}

		// Mark token as used
		await EmailVerificationTokenRepository.markAsUsed(verificationToken._id);

		// Get reservation
		const reservation = verificationToken.reservationId;

		if (!reservation) {
			throw new Error("Reservation not found");
		}

		// Update last accessed timestamp
		await ReservationRepository.update(reservation._id, {
			lastAccessedAt: new Date(),
		});

		return {
			success: true,
			reservation,
			token: verificationToken.token, // Return token for continued access
		};
	}

	/**
	 * Verify code (6-digit) and get reservation
	 * @param {string} email - Guest email
	 * @param {string} code - 6-digit verification code
	 * @returns {Promise<Object>}
	 */
	async verifyCodeAndGetReservation(email, code) {
		// Find active tokens with this email (no reservationId filter)
		const tokens = await EmailVerificationTokenRepository.findActiveByEmail(
			email
		);

		console.log(`[Verify Code] Email: ${email}, Code: ${code}`);
		console.log(`[Verify Code] Found ${tokens.length} active tokens`);
		if (tokens.length > 0) {
			console.log(`[Verify Code] Token codes:`, tokens.map(t => t.code));
		}

		// Find matching code
		const matchingToken = tokens.find(
			(t) => t.code === code && !t.used && new Date() < t.expiresAt
		);

		console.log(`[Verify Code] Matching token found: ${!!matchingToken}`);

		if (!matchingToken) {
			throw new Error("Invalid or expired verification code");
		}

		// Mark as used and return reservation
		await EmailVerificationTokenRepository.markAsUsed(matchingToken._id);

		// Get reservation (it's already populated)
		const reservation = matchingToken.reservationId;

		if (!reservation) {
			throw new Error("Reservation not found");
		}

		// Update last accessed timestamp
		await ReservationRepository.update(reservation._id, {
			lastAccessedAt: new Date(),
		});

		return {
			success: true,
			reservation,
			token: matchingToken.token,
		};
	}

	/**
	 * Request access by email only (no confirmation code needed)
	 * Finds most recent reservation and sends verification email
	 * @param {string} email - Guest email
	 * @returns {Promise<Object>}
	 */
	async requestReservationAccessByEmail(email) {
		// Find most recent reservation for this email
		const reservations = await ReservationRepository.findAll({
			guestEmail: email.toLowerCase(),
		});

		if (!reservations || reservations.length === 0) {
			throw new Error("No reservations found for this email address");
		}

		// Sort by creation date to get most recent
		reservations.sort((a, b) => {
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

		const reservation = reservations[0];

		// Check if reservation is cancelled
		if (reservation.status === "cancelled") {
			// If only cancelled reservations, still allow but mention it
			const hasActiveReservations = reservations.some(
				(r) => r.status !== "cancelled"
			);
			if (!hasActiveReservations) {
				throw new Error(
					"All reservations for this email have been cancelled"
				);
			}
		}

		// Rate limiting: Check if too many requests from this email
		const recentCount = await EmailVerificationTokenRepository.countRecentByEmail(
			email,
			60 // Last 60 minutes
		);

		if (recentCount >= 5) {
			throw new Error(
				"Too many verification requests. Please try again later."
			);
		}

		// Send verification email for the most recent reservation
		await EmailService.sendReservationVerification(reservation);

		return {
			success: true,
			message: "Verification email sent to your most recent reservation.",
			reservationDate: reservation.checkInDate,
			expiresInMinutes: 15,
		};
	}

	/**
	 * Get reservation by confirmation code only
	 * @param {string} confirmationCode - Confirmation code
	 * @returns {Promise<Object>}
	 */
	async getReservationByCode(confirmationCode) {
		const reservation = await ReservationRepository.findByConfirmationCode(
			confirmationCode
		);

		if (!reservation) {
			throw new Error("Reservation not found");
		}

		// Update last accessed timestamp
		await ReservationRepository.update(reservation._id, {
			lastAccessedAt: new Date(),
		});

		return {
			success: true,
			reservation,
		};
	}

	/**
	 * Get reservation by confirmation code and email (simplified access)
	 * Less secure but easier for guests
	 * @param {string} email - Guest email
	 * @param {string} confirmationCode - Confirmation code
	 * @returns {Promise<Object>}
	 */
	async getReservationByCodeAndEmail(email, confirmationCode) {
		const reservation = await ReservationRepository.findByConfirmationCode(
			confirmationCode
		);

		if (!reservation) {
			throw new Error("Reservation not found");
		}

		if (reservation.guestEmail.toLowerCase() !== email.toLowerCase()) {
			throw new Error("Email does not match reservation");
		}

		// Update last accessed timestamp
		await ReservationRepository.update(reservation._id, {
			lastAccessedAt: new Date(),
		});

		return {
			success: true,
			reservation,
		};
	}
}

export default new ReservationVerificationService();
