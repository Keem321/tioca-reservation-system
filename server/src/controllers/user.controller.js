import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import ReservationService from "../services/reservation.service.js";

class UserController {
	/**
	 * Get current user's profile
	 * @route GET /api/user/profile
	 * @param {import('express').Request} req - Express request object
	 * @param {import('express').Response} res - Express response object
	 * @returns {void}
	 */
	async getProfile(req, res) {
		try {
			const user = await User.findById(req.user._id).select("-password");
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}
			res.json(user);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	/**
	 * Update user profile (name, email)
	 * @route PUT /api/user/profile
	 * @param {import('express').Request} req - Express request object
	 * @param {import('express').Response} res - Express response object
	 * @returns {void}
	 */
	async updateProfile(req, res) {
		try {
			const { name, email, currencyPreference } = req.body;

			// Prevent updating sensitive fields
			const updateData = {};
			if (name !== undefined) updateData.name = name;

			// Email update: check for uniqueness
			if (email !== undefined) {
				const existingUser = await User.findOne({
					email,
					_id: { $ne: req.user._id },
				});
				if (existingUser) {
					return res.status(400).json({ error: "Email already in use" });
				}
				updateData.email = email;
			}

			// Currency preference update
			if (currencyPreference !== undefined) {
				const validCurrencies = ["USD", "JPY"];
				if (validCurrencies.includes(currencyPreference)) {
					updateData.currencyPreference = currencyPreference;
				}
			}

			const user = await User.findByIdAndUpdate(req.user._id, updateData, {
				new: true,
				runValidators: true,
			}).select("-password");

			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}

			res.json(user);
		} catch (err) {
			res.status(400).json({ error: err.message });
		}
	}

	/**
	 * Change user password
	 * @route POST /api/user/change-password
	 * @param {import('express').Request} req - Express request object with currentPassword and newPassword
	 * @param {import('express').Response} res - Express response object
	 * @returns {void}
	 */
	async changePassword(req, res) {
		try {
			const { currentPassword, newPassword, confirmPassword } = req.body;

			// Validate inputs
			if (!currentPassword || !newPassword || !confirmPassword) {
				return res
					.status(400)
					.json({ error: "All password fields are required" });
			}

			if (newPassword !== confirmPassword) {
				return res.status(400).json({ error: "Passwords do not match" });
			}

			if (newPassword.length < 6) {
				return res
					.status(400)
					.json({ error: "Password must be at least 6 characters" });
			}

			// Get user with password field
			const user = await User.findById(req.user._id);
			if (!user) {
				return res.status(404).json({ error: "User not found" });
			}

			// Check if user has a password (local strategy users only)
			if (!user.password) {
				return res.status(400).json({
					error: "Password change not available for OAuth users",
				});
			}

			// Verify current password
			const isPasswordValid = await bcrypt.compare(
				currentPassword,
				user.password
			);
			if (!isPasswordValid) {
				return res.status(401).json({ error: "Current password is incorrect" });
			}

			// Hash and update new password
			const hashedPassword = await bcrypt.hash(newPassword, 10);
			user.password = hashedPassword;
			await user.save();

			res.json({ message: "Password changed successfully" });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	/**
	 * Get user's active/upcoming reservations
	 * @route GET /api/user/active-reservations
	 * @param {import('express').Request} req - Express request object
	 * @param {import('express').Response} res - Express response object
	 * @returns {void}
	 */
	async getActiveReservations(req, res) {
		try {
			// Get reservations for current user where check-in is >= today
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const reservations = await ReservationService.getReservationsByUserId(
				req.user._id
			);

			// Filter to active/upcoming (check-in >= today, status not checked-out/cancelled)
			const activeReservations = reservations.filter((r) => {
				const checkInDate = new Date(r.checkInDate);
				checkInDate.setHours(0, 0, 0, 0);
				return (
					checkInDate >= today &&
					!["checked-out", "cancelled"].includes(r.status)
				);
			});

			res.json(activeReservations);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}
}

export default new UserController();
