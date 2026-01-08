import { Router } from "express";
const paymentRouter = Router();
import {
	createPaymentIntent,
	confirmPayment,
	processRefund,
} from "../controllers/payment.controller.js";
import { requireAuth, requireRole } from "../middleware/roleAuth.js";

// Create payment intent (authenticated users)
paymentRouter.post(
	"/create-intent",
	requireAuth,
	createPaymentIntent
);

// Confirm payment (authenticated users)
paymentRouter.post("/confirm", requireAuth, confirmPayment);

// Process refund (managers only)
paymentRouter.post("/refund", requireAuth, requireRole("manager"), processRefund);

export default paymentRouter;

