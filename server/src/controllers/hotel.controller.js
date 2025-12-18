// controllers/hotelController.js

import HotelService from "../services/hotel.service.js";

export async function getHotels(req, res) {
	try {
		const hotels = await HotelService.getAllHotels();
		res.json(hotels);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

export async function createHotel(req, res) {
	try {
		const hotel = await HotelService.createHotel(req.body);
		res.status(201).json(hotel);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

export async function getHotelById(req, res) {
	try {
		const hotel = await HotelService.getHotelById(req.params.id);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json(hotel);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

export async function updateHotel(req, res) {
	try {
		const hotel = await HotelService.updateHotel(req.params.id, req.body);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json(hotel);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
}

export async function deleteHotel(req, res) {
	try {
		const hotel = await HotelService.deleteHotel(req.params.id);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json({ message: "Hotel deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}
