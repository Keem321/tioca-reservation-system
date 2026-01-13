/**
 * Payment type definitions for Stripe integration
 */

/**
 * Payment intent creation request
 */
export interface CreatePaymentIntentRequest {
	reservationId: string;
	amount: number; // Amount in cents
	currency?: string; // Default: 'usd'
}

/**
 * Payment intent response from backend
 */
export interface PaymentIntentResponse {
	clientSecret: string;
	paymentIntentId: string;
}

/**
 * Payment confirmation request
 */
export interface ConfirmPaymentRequest {
	reservationId: string;
	paymentIntentId: string;
}

/**
 * Payment confirmation response
 */
export interface ConfirmPaymentResponse {
	success: boolean;
	reservation: {
		_id: string;
		paymentStatus: "paid" | "partial" | "unpaid" | "refunded";
		status:
			| "pending"
			| "confirmed"
			| "checked-in"
			| "checked-out"
			| "cancelled";
	};
	chargeId?: string;
	message?: string;
}

/**
 * Payment error response
 */
export interface PaymentError {
	message: string;
	code?: string;
	type?: string;
}
