/**
 * Reservation amenity selection
 */
export interface ReservationAmenity {
	offeringId: string;
	name: string;
	price: number; // Price in cents
	priceType: "per-night" | "flat";
}

/**
 * Reservation type definition for frontend usage.
 */
export interface Reservation {
	_id: string;
	roomId:
		| string
		| {
				_id: string;
				podId: string;
				quality: string;
				floor: string;
		  };
	userId?: string | { _id: string; name: string; email: string };
	guestName: string;
	guestEmail: string;
	guestPhone?: string;
	checkInDate: string;
	checkOutDate: string;
	numberOfGuests: number;
	offeringId?: string; // Room offering ID (populated from backend)
	baseRoomPrice: number; // Price per night in cents
	selectedAmenities: ReservationAmenity[];
	numberOfNights: number;
	totalPrice: number; // Total in cents
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
	userId?: string;
	guestName: string;
	guestEmail: string;
	guestPhone?: string;
	checkInDate: string;
	checkOutDate: string;
	numberOfGuests: number;
	offeringId: string; // Room offering ID
	selectedAmenities: string[]; // Array of amenity offering IDs
	totalPrice: number; // Calculated total in cents
	status?: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
	paymentStatus?: "unpaid" | "partial" | "paid" | "refunded";
	specialRequests?: string;
	holdId?: string; // Optional hold ID for overbooking prevention
}
