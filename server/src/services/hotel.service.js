// services/hotel.service.js
const HotelRepository = require("../repositories/hotel.repository");

const HotelService = {
	async getAllHotels() {
		return HotelRepository.findAll();
	},
	async getHotelById(id) {
		return HotelRepository.findById(id);
	},
	async createHotel(data) {
		return HotelRepository.create(data);
	},
	async updateHotel(id, data) {
		return HotelRepository.update(id, data);
	},
	async deleteHotel(id) {
		return HotelRepository.remove(id);
	},
};

module.exports = HotelService;
