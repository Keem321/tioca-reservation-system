import { Router } from "express";
const paymentRouter = Router();
import {
	createPaymentIntent,
	confirmPayment,
	processRefund,
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

export default paymentRouter;
