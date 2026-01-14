/**
 * Pricing Service
 * Handles all pricing calculations for reservations
 * Works with cents-based pricing for precision
 */

import Offering from "../models/offering.model.js";

class PricingService {
	/**
	 * Calculate total reservation price based on room offering and amenities
	 * @param {string} offeringId - Room offering ID
	 * @param {number} numberOfNights - Number of nights staying
	 * @param {array} selectedAmenityIds - Array of selected amenity offering IDs
	 * @returns {Promise<{basePrice: number, amenitiesPrice: number, totalPrice: number, breakdown: array}>}
	 */
	async calculateReservationPrice(
		offeringId,
		numberOfNights,
		selectedAmenityIds = []
	) {
		try {
			// Get room offering
			const roomOffering = await Offering.findById(offeringId);
			if (!roomOffering || roomOffering.type !== "room") {
				throw new Error("Invalid room offering ID or offering is not a room");
			}

			// Calculate base room price
			const basePrice = roomOffering.basePrice * numberOfNights;

			// Get amenity offerings and calculate their prices
			let amenitiesPrice = 0;
			const amenitiesBreakdown = [];

			if (selectedAmenityIds.length > 0) {
				const amenities = await Offering.find({
					_id: { $in: selectedAmenityIds },
					type: "amenity",
				});

				for (const amenity of amenities) {
					let amenityPrice = 0;

					if (amenity.priceType === "per-night") {
						amenityPrice = amenity.basePrice * numberOfNights;
					} else if (amenity.priceType === "flat") {
						amenityPrice = amenity.basePrice;
					}

					amenitiesPrice += amenityPrice;

					amenitiesBreakdown.push({
						name: amenity.name,
						offeringId: amenity._id,
						price: amenity.basePrice,
						priceType: amenity.priceType,
						totalPrice: amenityPrice,
					});
				}
			}

			const totalPrice = basePrice + amenitiesPrice;

			return {
				basePrice,
				amenitiesPrice,
				totalPrice,
				breakdown: [
					{
						type: "room",
						name: roomOffering.name,
						nightlyRate: roomOffering.basePrice,
						nights: numberOfNights,
						subtotal: basePrice,
					},
					...amenitiesBreakdown.map((amenity) => ({
						type: "amenity",
						name: amenity.name,
						offeringId: amenity.offeringId,
						rate: amenity.price,
						priceType: amenity.priceType,
						subtotal: amenity.totalPrice,
					})),
				],
			};
		} catch (err) {
			throw new Error(`Failed to calculate reservation price: ${err.message}`);
		}
	}

	/**
	 * Get offering by room quality
	 * @param {string} quality - Room quality level
	 * @returns {Promise<object>} Offering document
	 */
	async getOfferingByQuality(quality) {
		return await Offering.findOne({
			type: "room",
			quality,
			isActive: true,
		});
	}

	/**
	 * Get all room offerings
	 * @param {boolean} activeOnly - Only return active offerings
	 * @returns {Promise<array>} Array of room offerings
	 */
	async getRoomOfferings(activeOnly = true) {
		const filter = { type: "room" };
		if (activeOnly) {
			filter.isActive = true;
		}
		return await Offering.find(filter).sort({ basePrice: 1 });
	}

	/**
	 * Get all amenity offerings
	 * @param {boolean} activeOnly - Only return active offerings
	 * @returns {Promise<array>} Array of amenity offerings
	 */
	async getAmenityOfferings(activeOnly = true) {
		const filter = { type: "amenity" };
		if (activeOnly) {
			filter.isActive = true;
		}
		return await Offering.find(filter).sort({ name: 1 });
	}

	/**
	 * Get amenities applicable to a specific room quality
	 * @param {string} quality - Room quality level
	 * @returns {Promise<array>} Array of applicable amenity offerings
	 */
	async getApplicableAmenities(quality) {
		return await Offering.find({
			type: "amenity",
			isActive: true,
			$or: [
				{ applicableQualities: { $size: 0 } }, // Applies to all if empty
				{ applicableQualities: quality },
			],
		}).sort({ name: 1 });
	}

	/**
	 * Apply promotional discount to price
	 * @param {number} basePrice - Base price in cents
	 * @param {string} discountCode - Discount code
	 * @returns {Promise<{discountAmount: number, finalPrice: number}>}
	 */
	async applyDiscount(basePrice, discountCode) {
		// TODO: Implement discount logic with database lookups
		// For now, return no discount
		return {
			discountAmount: 0,
			finalPrice: basePrice,
		};
	}
}

export default new PricingService();
