/**
 * Offering Controller
 * Handles CRUD operations for room and amenity offerings
 */

import Offering from "../models/offering.model.js";

/**
 * Get all offerings (room and amenity)
 * @route GET /api/offerings
 * @query {string} type - Filter by type: 'room' or 'amenity' (optional)
 * @query {boolean} activeOnly - Only return active offerings (default: true)
 */
export async function getOfferings(req, res) {
	try {
		const { type, activeOnly = "true" } = req.query;
		const filters = {};

		if (type) {
			filters.type = type;
		}

		if (activeOnly === "true") {
			filters.isActive = true;
		}

		const offerings = await Offering.find(filters).sort({ basePrice: 1 });
		res.json(offerings);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Get offering by ID
 * @route GET /api/offerings/:id
 */
export async function getOfferingById(req, res) {
	try {
		const { id } = req.params;
		const offering = await Offering.findById(id);

		if (!offering) {
			return res.status(404).json({ error: "Offering not found" });
		}

		res.json(offering);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Get room offerings
 * @route GET /api/offerings/room-offerings
 * @query {boolean} activeOnly - Only return active offerings (default: true)
 */
export async function getRoomOfferings(req, res) {
	try {
		const { activeOnly = "true" } = req.query;
		const filters = { type: "room" };

		if (activeOnly === "true") {
			filters.isActive = true;
		}

		const offerings = await Offering.find(filters).sort({ basePrice: 1 });
		res.json(offerings);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Get amenity offerings
 * @route GET /api/offerings/amenity-offerings
 * @query {boolean} activeOnly - Only return active offerings (default: true)
 */
export async function getAmenityOfferings(req, res) {
	try {
		const { activeOnly = "true" } = req.query;
		const filters = { type: "amenity" };

		if (activeOnly === "true") {
			filters.isActive = true;
		}

		const offerings = await Offering.find(filters).sort({ name: 1 });
		res.json(offerings);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Create new offering (Admin only)
 * @route POST /api/offerings
 * @body {string} name - Offering name
 * @body {string} type - 'room' or 'amenity'
 * @body {string} quality - Quality level (for room offerings)
 * @body {number} basePrice - Base price in cents
 * @body {string} priceType - 'per-night' or 'flat'
 * @body {string} description - Description
 * @body {array} applicableFloors - Applicable floors (for amenities)
 * @body {array} applicableQualities - Applicable room qualities (for amenities)
 */
export async function createOffering(req, res) {
	try {
		const {
			name,
			type,
			quality,
			basePrice,
			priceType = "per-night",
			description,
			applicableFloors,
			applicableQualities,
		} = req.body;

		// Validate required fields
		if (!name || !type || !basePrice) {
			return res.status(400).json({
				error: "name, type, and basePrice are required",
			});
		}

		if (!["room", "amenity"].includes(type)) {
			return res.status(400).json({ error: "Invalid type" });
		}

		if (type === "room" && !quality) {
			return res
				.status(400)
				.json({ error: "quality is required for room offerings" });
		}

		const offering = new Offering({
			name,
			type,
			quality,
			basePrice: Math.round(basePrice), // Ensure it's an integer (cents)
			priceType,
			description,
			applicableFloors,
			applicableQualities,
		});

		await offering.save();
		res.status(201).json(offering);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

/**
 * Update offering (Admin only)
 * @route PUT /api/offerings/:id
 */
export async function updateOffering(req, res) {
	try {
		const { id } = req.params;
		const updates = req.body;

		// Don't allow changing type
		if (updates.type) {
			delete updates.type;
		}

		// Ensure basePrice is an integer
		if (updates.basePrice) {
			updates.basePrice = Math.round(updates.basePrice);
		}

		const offering = await Offering.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		});

		if (!offering) {
			return res.status(404).json({ error: "Offering not found" });
		}

		res.json(offering);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

/**
 * Delete offering (Admin only)
 * @route DELETE /api/offerings/:id
 */
export async function deleteOffering(req, res) {
	try {
		const { id } = req.params;
		const offering = await Offering.findByIdAndDelete(id);

		if (!offering) {
			return res.status(404).json({ error: "Offering not found" });
		}

		res.json({ message: "Offering deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Toggle offering active status (Admin only)
 * @route PATCH /api/offerings/:id/toggle-status
 */
export async function toggleOfferingStatus(req, res) {
	try {
		const { id } = req.params;
		const offering = await Offering.findById(id);

		if (!offering) {
			return res.status(404).json({ error: "Offering not found" });
		}

		offering.isActive = !offering.isActive;
		await offering.save();

		res.json(offering);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}
