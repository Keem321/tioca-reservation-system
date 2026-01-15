/**
 * Payment type definitions for Stripe integration
 */

/**
 * Room information stored with payment
 */
export interface PaymentRoomInfo {
	roomId: string;
	podId: string;
	quality: string;
	floor: string;
	basePrice: number; // Price per night in cents
}

/**
 * Amenity information stored with payment
 */
export interface PaymentAmenityInfo {
	offeringId: string;
	name: string;
	price: number; // Price in cents
	priceType: "per-night" | "flat";
	totalPrice: number; // Calculated total in cents
}

/**
 * Price breakdown stored with payment
 */
export interface PaymentPriceBreakdown {
	baseRoomTotal: number; // Base room price × nights in cents
	amenitiesTotal: number; // Sum of all amenities in cents
	subtotal: number; // Subtotal in cents
	taxes: number; // Taxes in cents
	discounts: number; // Discounts in cents
	total: number; // Final total in cents
}

/**
 * Detailed reservation information snapshot stored with payment
 */
export interface PaymentReservationDetails {
	checkInDate: string;
	checkOutDate: string;
	numberOfNights: number;
	numberOfGuests: number;
	guestName: string;
	guestEmail: string;
	guestPhone?: string;
	rooms: PaymentRoomInfo[];
	selectedAmenities: PaymentAmenityInfo[];
	priceBreakdown: PaymentPriceBreakdown;
	specialRequests?: string;
}

/**
 * Payment record as returned from backend
 */
export interface Payment {
	_id: string;
	reservationId: string;
	userId?: string;
	amount: number; // Amount in cents
	currency: string;
	status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
	stripePaymentIntentId?: string;
	stripeChargeId?: string;
	stripeCustomerId?: string;
	refundAmount: number;
	refundStripeId?: string;
	failureReason?: string;
	failureCode?: string;
	description?: string;
	receiptUrl?: string;
	reservationDetails?: PaymentReservationDetails;
	createdAt?: string;
	updatedAt?: string;
}

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
