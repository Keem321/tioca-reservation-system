// controllers/hotelController.js
const HotelService = require("../services/hotel.service");

exports.getHotels = async (req, res) => {
	try {
		const hotels = await HotelService.getAllHotels();
		res.json(hotels);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.createHotel = async (req, res) => {
	try {
		const hotel = await HotelService.createHotel(req.body);
		res.status(201).json(hotel);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
};

exports.getHotelById = async (req, res) => {
	try {
		const hotel = await HotelService.getHotelById(req.params.id);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json(hotel);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

exports.updateHotel = async (req, res) => {
	try {
		const hotel = await HotelService.updateHotel(req.params.id, req.body);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json(hotel);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
};

exports.deleteHotel = async (req, res) => {
	try {
		const hotel = await HotelService.deleteHotel(req.params.id);
		if (!hotel) return res.status(404).json({ error: "Hotel not found" });
		res.json({ message: "Hotel deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
