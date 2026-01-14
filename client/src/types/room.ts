/**
 * Pod quality level definitions for TIOCA Pod Hotel
 * Quality determines amenities, size, and pricing
 */
export type PodQuality =
	| "classic" // Classic Pearl - Standard (80×40×40")
	| "milk" // Milk Pearl - Standard+ (84×42×45")
	| "golden" // Golden Pearl - Premium (86×45×50")
	| "crystal" // Crystal Boba Suite - First Class (90×55×65")
	| "matcha"; // Matcha Pearl - Women-Only Exclusive (86×45×50")

/**
 * Pod zone/floor definitions - each floor has one zone
 * Maps to numeric floors for pod ID generation (women-only=1, men-only=2, couples=3, business=4)
 */
export type PodFloor = "women-only" | "men-only" | "couples" | "business";

/**
 * Pod status for availability tracking
 */
export type PodStatus = "available" | "occupied" | "maintenance" | "reserved";

/**
 * Pod dimensions in inches (length × width × height)
 */
export interface PodDimensions {
	length: number; // inches
	width: number; // inches
	height: number; // inches
}

// Import Offering type for populated offering data
import type { Offering } from "./offering";

/**
 * Room/Pod type definition for frontend usage
 */
export interface Room {
	_id: string;
	podId: string; // User-friendly identifier: e.g., "301" for couples floor, Pod 1
	quality: PodQuality; // Quality level (classic, milk, golden, crystal, matcha)
	floor: PodFloor; // Floor zone (women-only, men-only, couples, business)
	capacity: number;
	offeringId: string; // Reference to the Offering that defines pricing
	offering?: Offering; // Populated offering data from backend (optional because it may not always be populated)
	description?: string;
	dimensions?: PodDimensions;
	amenities?: string[];
	images?: string[];
	status: PodStatus;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Room/Pod form data for creating/updating pods
 */
export interface RoomFormData {
	podId?: string; // Optional - will be auto-generated if not provided
	quality: PodQuality;
	floor: PodFloor; // Floor zone (determines which floor the pod is on)
	offeringId: string; // Room offering ID
	description?: string;
	dimensions?: PodDimensions;
	amenities?: string[];
	images?: string[];
	status?: PodStatus;
}
