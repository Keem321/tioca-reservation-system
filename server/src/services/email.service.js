import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - check for .env.development first, then .env
// Check in server directory first, then root directory
const serverEnvPath = path.resolve(__dirname, "../../.env.development");
const rootEnvPath = path.resolve(__dirname, "../../../.env.development");
const serverEnv = path.resolve(__dirname, "../../.env");
const rootEnv = path.resolve(__dirname, "../../../.env");

if (fs.existsSync(serverEnvPath)) {
	dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
	dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(serverEnv)) {
	dotenv.config({ path: serverEnv });
} else if (fs.existsSync(rootEnv)) {
	dotenv.config({ path: rootEnv });
} else {
	dotenv.config();
}

import nodemailer from "nodemailer";
import fsPromises from "fs/promises";
import crypto from "crypto";
import EmailVerificationTokenRepository from "../repositories/emailVerificationToken.repository.js";
import { formatMoney } from "../utils/money.js";

/**
 * Email Service
 * Handles sending emails using Nodemailer with HTML templates
 */
class EmailService {
	constructor() {
		this.transporter = null;
		this.templatesPath = path.join(__dirname, "../templates/email");
		this.initializeTransporter();
	}

	/**
	 * Initialize Nodemailer transporter
	 */
	initializeTransporter() {
		const emailProvider = process.env.EMAIL_PROVIDER || "nodemailer";

		if (emailProvider === "nodemailer") {
			// Using SMTP (Gmail, etc.)
			const smtpConfig = {
				host: process.env.SMTP_HOST || "smtp.gmail.com",
				port: parseInt(process.env.SMTP_PORT || "587"),
				secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASSWORD,
				},
			};

			// Only create transporter if credentials are provided
			if (smtpConfig.auth.user && smtpConfig.auth.pass) {
				this.transporter = nodemailer.createTransport(smtpConfig);
				console.log("✅ Email service initialized with SMTP");
			} else {
				console.warn(
					"⚠️  Email credentials not configured. Email functionality disabled."
				);
				console.warn(
					"   Set SMTP_USER and SMTP_PASSWORD environment variables."
				);
			}
		}
	}

	/**
	 * Load and compile an email template
	 * @param {string} templateName - Name of the template file (without extension)
	 * @param {Object} data - Data to interpolate into the template
	 * @returns {Promise<string>} - Compiled HTML
	 */
	async loadTemplate(templateName, data) {
		try {
			const templatePath = path.join(
				this.templatesPath,
				`${templateName}.html`
			);
			let html = await fsPromises.readFile(templatePath, "utf-8");

			// Simple template replacement (Handlebars-like syntax)
			// Replace {{variable}} with data values
			html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
				return data[key] !== undefined ? data[key] : "";
			});

			// Handle conditionals {{#if variable}}...{{/if}}
			html = html.replace(
				/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
				(match, key, content) => {
					return data[key] ? content : "";
				}
			);

			return html;
		} catch (error) {
			console.error(`Error loading template ${templateName}:`, error);
			throw new Error(`Failed to load email template: ${templateName}`);
		}
	}

	/**
	 * Send an email
	 * @param {Object} options - Email options
	 * @returns {Promise<Object>}
	 */
	async sendEmail({ to, subject, html, text }) {
		if (!this.transporter) {
			console.warn(
				"Email not sent (transporter not configured):",
				subject,
				"to",
				to
			);
			// In development, log the email instead of throwing
			if (process.env.NODE_ENV === "development") {
				console.log("📧 [DEV MODE] Email Preview:");
				console.log("To:", to);
				console.log("Subject:", subject);
				console.log("Text:", text);
				return { messageId: "dev-mode-no-send" };
			}
			throw new Error("Email service not configured");
		}

		const mailOptions = {
			from: `${process.env.FROM_NAME || "TIOCA Pod Hotel"} <${
				process.env.FROM_EMAIL || process.env.SMTP_USER
			}>`,
			to,
			subject,
			html,
			text: text || this.htmlToText(html),
		};

		try {
			const info = await this.transporter.sendMail(mailOptions);
			console.log(`✅ Email sent: ${subject} to ${to}`);
			return info;
		} catch (error) {
			console.error(`❌ Error sending email to ${to}:`, error);
			throw error;
		}
	}

	/**
	 * Simple HTML to text converter
	 * @param {string} html - HTML content
	 * @returns {string} - Plain text
	 */
	htmlToText(html) {
		return html
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, "")
			.replace(/\s+/g, " ")
			.trim();
	}

	/**
	 * Send booking confirmation email
	 * @param {Object} reservation - Reservation object
	 * @param {Object} payment - Payment object (optional)
	 * @returns {Promise<Object>}
	 */
	async sendBookingConfirmation(reservation, payment = null) {
		try {
			// Calculate nights
			const checkIn = new Date(reservation.checkInDate);
			const checkOut = new Date(reservation.checkOutDate);
			const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

			// Get room info
			const room = reservation.roomId;
			
			// Format quality with proper casing
			const formatQuality = (quality) => {
				const qualityMap = {
					classic: "Classic Pearl",
					milk: "Milk Pearl",
					golden: "Golden Pearl",
					crystal: "Crystal Boba Suite",
					matcha: "Matcha Pearl",
				};
				return qualityMap[quality?.toLowerCase()] || quality || "Pod";
			};

			// Format floor with proper readable formatting
			const formatFloor = (floor) => {
				const floorMap = {
					"women-only": "Women-Only Floor",
					"men-only": "Men-Only Floor",
					couples: "Couples Floor",
					business: "Business/Quiet Floor",
				};
				return floorMap[floor?.toLowerCase()] || floor || "Standard Floor";
			};

			const podType =
				typeof room === "object" && room.quality
					? formatQuality(room.quality)
					: "Pod";
			const floor =
				typeof room === "object" && room.floor
					? formatFloor(room.floor)
					: "Standard Floor";

			// Format dates
			const formatDate = (date) => {
				const d = new Date(date);
				return d.toLocaleDateString("en-US", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			};

			// Get frontend URL
			const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

			// Template data
			const templateData = {
				guestName: reservation.guestName,
				guestEmail: reservation.guestEmail,
				guestPhone: reservation.guestPhone || "",
				confirmationCode: reservation.confirmationCode,
				podType,
				floor,
				checkInDate: formatDate(reservation.checkInDate),
				checkOutDate: formatDate(reservation.checkOutDate),
				numberOfGuests: reservation.numberOfGuests,
				nights,
				multiplNights: nights > 1,
				subtotal: formatMoney(reservation.totalPrice, "USD"),
				totalPrice: formatMoney(reservation.totalPrice, "USD"),
				receiptUrl: payment?.receiptUrl || "",
				hasAccount: !!reservation.userId,
				manageReservationUrl: `${frontendUrl}/reservations/lookup`,
				profileUrl: `${frontendUrl}/profile`,
				supportEmail: process.env.SUPPORT_EMAIL || "support@tioca.com",
			};

			const html = await this.loadTemplate("booking-confirmation", templateData);

			await this.sendEmail({
				to: reservation.guestEmail,
				subject: `Booking Confirmed - TIOCA Pod Hotel (${reservation.confirmationCode})`,
				html,
			});

			console.log(
				`✅ Booking confirmation sent to ${reservation.guestEmail}`
			);
			return { success: true };
		} catch (error) {
			console.error("Error sending booking confirmation:", error);
			// Don't throw - we don't want to fail the booking if email fails
			return { success: false, error: error.message };
		}
	}

	/**
	 * Generate verification code (6 digits)
	 * @returns {string}
	 */
	generateVerificationCode() {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	/**
	 * Generate secure token
	 * @returns {string}
	 */
	generateToken() {
		return crypto.randomBytes(32).toString("hex");
	}

	/**
	 * Send reservation verification email
	 * @param {Object} reservation - Reservation object
	 * @returns {Promise<Object>}
	 */
	async sendReservationVerification(reservation) {
		try {
			// Generate verification token and code
			const token = this.generateToken();
			const code = this.generateVerificationCode();

			// Calculate expiration (15 minutes)
			const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

			// Save token to database
			await EmailVerificationTokenRepository.create({
				email: reservation.guestEmail.toLowerCase(),
				reservationId: reservation._id,
				token,
				code,
				purpose: "reservation_access",
				expiresAt,
			});

			// Get frontend URL
			const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

			// Template data
			const templateData = {
				guestName: reservation.guestName,
				confirmationCode: reservation.confirmationCode,
				verificationUrl: `${frontendUrl}/reservations/verify/${token}`,
				verificationCode: code,
				manageReservationUrl: `${frontendUrl}/reservations/lookup`,
				supportEmail: process.env.SUPPORT_EMAIL || "support@tioca.com",
			};

			const html = await this.loadTemplate("verification", templateData);

			await this.sendEmail({
				to: reservation.guestEmail,
				subject: `Verify Your TIOCA Reservation Access (${reservation.confirmationCode})`,
				html,
			});

			console.log(
				`✅ Verification email sent to ${reservation.guestEmail}`
			);
			return { success: true, token, code };
		} catch (error) {
			console.error("Error sending verification email:", error);
			throw error;
		}
	}

	/**
	 * Verify email transporter connection
	 * @returns {Promise<boolean>}
	 */
	async verifyConnection() {
		if (!this.transporter) {
			return false;
		}
		try {
			await this.transporter.verify();
			console.log("✅ Email service connection verified");
			return true;
		} catch (error) {
			console.error("❌ Email service connection failed:", error);
			return false;
		}
	}
}

export default new EmailService();
