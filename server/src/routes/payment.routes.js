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

// Process refund (managers only)
paymentRouter.post(
	"/refund",
	requireAuth,
	requireRole("manager"),
	processRefund
);

// Update payment (managers only)
paymentRouter.patch(
	"/:paymentId",
	requireAuth,
	requireRole("manager"),
	updatePayment
);

// Get payment edit history (managers only)
paymentRouter.get(
	"/:paymentId/history",
	requireAuth,
	requireRole("manager"),
	getPaymentHistory
);

// Get payment statistics (managers only)
paymentRouter.get(
	"/stats",
	requireAuth,
	requireRole("manager"),
	getPaymentStats
);

// Get revenue report (managers only)
paymentRouter.get(
	"/reports/revenue",
	requireAuth,
	requireRole("manager"),
	getRevenueReport
);

// Get all payments (managers only)
paymentRouter.get("/", requireAuth, requireRole("manager"), getPayments);

// Get single payment (managers only)
paymentRouter.get(
	"/:paymentId",
	requireAuth,
	requireRole("manager"),
	getPayment
);

// Get payment by reservation (managers only)
paymentRouter.get(
	"/reservation/:reservationId",
	requireAuth,
	requireRole("manager"),
	getPaymentByReservation
);

export default paymentRouter;
