// controllers/hotelController.js

import HotelService from "../services/hotel.service.js";

/**
 * Get all hotels
 * @route GET /api/hotels
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getHotels(req, res) {
	try {
		const hotels = await HotelService.getAllHotels();
		res.json(hotels);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Create a new hotel
 * @route POST /api/hotels
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function createHotel(req, res) {
	try {
		const hotel = await HotelService.createHotel(req.body);
		res.status(201).json(hotel);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

/**
 * Get a hotel by ID
 * @route GET /api/hotels/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function getHotelById(req, res) {
	try {
		const hotel = await HotelService.getHotelById(req.params.id);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json(hotel);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

/**
 * Update a hotel by ID
 * @route PUT /api/hotels/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function updateHotel(req, res) {
	try {
		const hotel = await HotelService.updateHotel(req.params.id, req.body);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json(hotel);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

/**
 * Delete a hotel by ID
 * @route DELETE /api/hotels/:id
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {void}
 */
export async function deleteHotel(req, res) {
	try {
		const hotel = await HotelService.deleteHotel(req.params.id);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json({ message: "Hotel deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}
