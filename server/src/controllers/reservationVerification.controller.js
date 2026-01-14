import ReservationVerificationService from "../services/reservationVerification.service.js";

/**
 * Request reservation access (sends verification email)
 * @route POST /api/reservations/request-access
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function requestReservationAccess(req, res) {
	try {
		const { email, confirmationCode } = req.body;

		if (!email || !confirmationCode) {
			return res.status(400).json({
				error: "Email and confirmation code are required",
			});
		}

		const result = await ReservationVerificationService.requestReservationAccess(
			email,
			confirmationCode
		);

		res.json(result);
	} catch (err) {
		console.error("Error requesting reservation access:", err.message);

		// Provide user-friendly error messages
		const statusCode = err.message.includes("not found") ? 404 : 400;

		res.status(statusCode).json({
			error: err.message,
		});
	}
}

/**
 * Verify token from email link
 * @route GET /api/reservations/verify/:token
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function verifyToken(req, res) {
	try {
		const { token } = req.params;

		if (!token) {
			return res.status(400).json({
				error: "Verification token is required",
			});
		}

		const result = await ReservationVerificationService.verifyTokenAndGetReservation(
			token
		);

		res.json(result);
	} catch (err) {
		console.error("Error verifying token:", err.message);

		const statusCode =
			err.message.includes("expired") || err.message.includes("used")
				? 410
				: 400;

		res.status(statusCode).json({
			error: err.message,
		});
	}
}

/**
 * Verify 6-digit code
 * @route POST /api/reservations/verify-code
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function verifyCode(req, res) {
	try {
		const { email, code } = req.body;

		if (!email || !code) {
			return res.status(400).json({
				error: "Email and verification code are required",
			});
		}

		const result = await ReservationVerificationService.verifyCodeAndGetReservation(
			email,
			code
		);

		res.json(result);
	} catch (err) {
		console.error("Error verifying code:", err.message);

		res.status(400).json({
			error: err.message,
		});
	}
}

/**
 * Request reservation access by email only (no confirmation code)
 * @route POST /api/reservations/request-access-by-email
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function requestReservationAccessByEmail(req, res) {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({
				error: "Email is required",
			});
		}

		const result = await ReservationVerificationService.requestReservationAccessByEmail(
			email
		);

		res.json(result);
	} catch (err) {
		console.error("Error requesting reservation access by email:", err.message);

		const statusCode = err.message.includes("not found") ? 404 : 400;

		res.status(statusCode).json({
			error: err.message,
		});
	}
}

/**
 * Get reservation by confirmation code only
 * @route POST /api/reservations/lookup-by-code
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function lookupReservationByCode(req, res) {
	try {
		const { confirmationCode } = req.body;

		if (!confirmationCode) {
			return res.status(400).json({
				error: "Confirmation code is required",
			});
		}

		const result = await ReservationVerificationService.getReservationByCode(
			confirmationCode
		);

		res.json(result);
	} catch (err) {
		console.error("Error looking up reservation:", err.message);

		const statusCode = err.message.includes("not found") ? 404 : 400;

		res.status(statusCode).json({
			error: err.message,
		});
	}
}

/**
 * Get reservation by confirmation code and email (simplified, no email verification)
 * @route POST /api/reservations/lookup
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function lookupReservation(req, res) {
	try {
		const { email, confirmationCode } = req.body;

		if (!email || !confirmationCode) {
			return res.status(400).json({
				error: "Email and confirmation code are required",
			});
		}

		const result = await ReservationVerificationService.getReservationByCodeAndEmail(
			email,
			confirmationCode
		);

		res.json(result);
	} catch (err) {
		console.error("Error looking up reservation:", err.message);

		const statusCode = err.message.includes("not found") ? 404 : 400;

		res.status(statusCode).json({
			error: err.message,
		});
	}
}
