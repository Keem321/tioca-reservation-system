/**
 * Offering Types
 * Represents pricing offerings for rooms and amenities
 */

export interface Offering {
	_id: string;
	name: string;
	type: "room" | "amenity";
	quality?: "classic" | "milk" | "golden" | "crystal" | "matcha";
	basePrice: number; // Price in cents
	currency: string;
	priceType: "per-night" | "flat";
	description?: string;
	features?: string[]; // List of features/amenities
	imageUrl?: string; // Image URL for display
	capacity?: string; // e.g., "1 guest" or "2 guests"
	tag?: string; // Optional tag like "Women Only" or "First Class"
	variant?: "single" | "twin"; // Room variant: single or twin (couples floor)
	applicableFloors?: string[];
	applicableQualities?: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface RoomOffering extends Offering {
	type: "room";
	quality: "classic" | "milk" | "golden" | "crystal" | "matcha";
}

export interface AmenityOffering extends Offering {
	type: "amenity";
}

export interface PricingBreakdown {
	type: "room" | "amenity";
	name: string;
	nightlyRate?: number;
	rate?: number;
	nights?: number;
	priceType?: "per-night" | "flat";
	subtotal: number;
}

export interface ReservationPricing {
	basePrice: number;
	amenitiesPrice: number;
	totalPrice: number;
	breakdown: PricingBreakdown[];
}
