/**
 * Room Image Utilities
 *
 * Centralized mapping of room quality types to their images.
 * This ensures consistent image display across the entire application.
 */

import type { PodQuality, PodFloor } from "../types/room";

/**
 * Image paths for each capsule quality type
 */
const ROOM_IMAGES: Record<PodQuality, string> = {
	classic: "/images/capsules/classic-pearl.jpg",
	milk: "/images/capsules/milk-pearl.jpg",
	golden: "/images/capsules/golden-pearl.jpg",
	crystal: "/images/capsules/crystal-boba.jpg",
	matcha: "/images/capsules/matcha-pearl.jpg",
};

/**
 * Get the image path for a room based on its quality and floor
 *
 * @param quality - The quality level of the room
 * @param floor - The floor type (optional, used for couples/twin rooms)
 * @returns The image path for the room
 */
export const getRoomImage = (quality: PodQuality, floor?: PodFloor): string => {
	// Use twin-pearl image for couples floor regardless of quality
	if (floor === "couples") {
		return "/images/capsules/twin-pearl.jpg";
	}

	return ROOM_IMAGES[quality] || ROOM_IMAGES.classic;
};

/**
 * Get the display name for a room quality
 *
 * @param quality - The quality level
 * @returns The formatted display name
 */
export const getRoomQualityLabel = (quality: PodQuality): string => {
	const labels: Record<PodQuality, string> = {
		classic: "Classic Pearl",
		milk: "Milk Pearl",
		golden: "Golden Pearl",
		crystal: "Crystal Boba Suite",
		matcha: "Matcha Pearl",
	};
	return labels[quality] || quality;
};

/**
 * Get the description for a room quality
 *
 * @param quality - The quality level
 * @returns Brief description of the quality level
 */
export const getRoomQualityDescription = (quality: PodQuality): string => {
	const descriptions: Record<PodQuality, string> = {
		classic: "Essential comfort for the efficient traveler",
		milk: "Enhanced space with premium comfort",
		golden: "Premium experience with spacious layout",
		crystal: "First-class luxury suite experience",
		matcha: "Women-only exclusive premium capsule",
	};
	return descriptions[quality] || "";
};

/**
 * Get dimensions for a room based on quality and floor
 *
 * @param quality - The quality level
 * @param floor - The floor type (optional)
 * @returns Dimension string in format: L" × W" × H"
 */
export const getRoomDimensions = (
	quality: PodQuality,
	floor?: PodFloor
): string => {
	const dimensions: Record<PodQuality, string> = {
		classic: '80" × 40" × 40"',
		milk: '84" × 42" × 45"',
		golden: '86" × 45" × 50"',
		crystal: '90" × 55" × 65"',
		matcha: '86" × 45" × 50"',
	};

	let dimension = dimensions[quality] || dimensions.classic;

	// Couples floor rooms are wider to accommodate two people
	if (floor === "couples") {
		dimension = dimension.replace(/× \d+"/, '× 60"');
	}

	return dimension;
};

/**
 * Get the full display label for a room (includes floor prefix if applicable)
 *
 * @param quality - The quality level
 * @param floor - The floor type
 * @returns Full display label (e.g., "Twin Golden Pearl" or "Matcha Pearl")
 */
export const getRoomDisplayLabel = (
	quality: PodQuality,
	floor: PodFloor
): string => {
	const baseLabel = getRoomQualityLabel(quality);

	if (floor === "couples") {
		return `Twin ${baseLabel}`;
	}

	return baseLabel;
};
