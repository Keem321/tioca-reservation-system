import { Router } from "express";
const paymentRouter = Router();
import {
	createPaymentIntent,
	confirmPayment,
	processRefund,
	getPayments,
	getPaymentStats,
	getPayment,
	getPaymentByReservation,
	getRevenueReport,
	updatePayment,
	getPaymentHistory,
} from "../controllers/payment.controller.js";
import { requireAuth, requireRole } from "../middleware/roleAuth.js";

// Create payment intent (public - no auth required)
paymentRouter.post("/create-intent", createPaymentIntent);

// Confirm payment (public - no auth required)
paymentRouter.post("/confirm", confirmPayment);

// Admin-only routes - payment modifications
// Process refund (admin only)
paymentRouter.post(
	"/refund",
	requireAuth,
	requireRole("admin"),
	processRefund
);

// Update payment (admin only)
paymentRouter.patch(
	"/:paymentId",
	requireAuth,
	requireRole("admin"),
	updatePayment
);

// Manager/Admin routes - viewing payment data
// Get payment edit history (manager can view, admin can view)
paymentRouter.get(
	"/:paymentId/history",
	requireAuth,
	requireRole("manager"),
	getPaymentHistory
);

// Get payment statistics (manager can view, admin can view)
paymentRouter.get(
	"/stats",
	requireAuth,
	requireRole("manager"),
	getPaymentStats
);

// Get revenue report (manager can view, admin can view)
paymentRouter.get(
	"/reports/revenue",
	requireAuth,
	requireRole("manager"),
	getRevenueReport
);

// Get all payments (manager can view, admin can view)
paymentRouter.get("/", requireAuth, requireRole("manager"), getPayments);

// Get single payment (manager can view, admin can view)
paymentRouter.get(
	"/:paymentId",
	requireAuth,
	requireRole("manager"),
	getPayment
);

// Get payment by reservation (manager can view, admin can view)
paymentRouter.get(
	"/reservation/:reservationId",
	requireAuth,
	requireRole("manager"),
	getPaymentByReservation
);

export default paymentRouter;
