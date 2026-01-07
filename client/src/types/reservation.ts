/**
 * Reservation type definition for frontend usage.
 */
export interface Reservation {
	_id: string;
	roomId: string | { _id: string; podId: string; quality: string; floor: string; pricePerNight: number };
	userId: string | { _id: string; name: string; email: string };
	guestName: string;
	guestEmail: string;
	guestPhone?: string;
	checkInDate: string;
	checkOutDate: string;
	numberOfGuests: number;
	totalPrice: number;
	status: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
	paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
	specialRequests?: string;
	cancellationReason?: string;
	cancelledAt?: string;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Reservation form data for creating/updating reservations
 */
export interface ReservationFormData {
	roomId: string;
	userId: string;
	guestName: string;
	guestEmail: string;
	guestPhone?: string;
	checkInDate: string;
	checkOutDate: string;
	numberOfGuests: number;
	totalPrice: number;
	status?: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
	paymentStatus?: "unpaid" | "partial" | "paid" | "refunded";
	specialRequests?: string;
}
