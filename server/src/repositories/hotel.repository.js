// repositories/HotelRepository.js
import Hotel from "../models/hotel.model.js";

const HotelRepository = {
	async findAll() {
		return Hotel.find();
	},
	async findById(id) {
		return Hotel.findById(id);
	},
	async create(data) {
		return Hotel.create(data);
	},
	async update(id, data) {
		return Hotel.findByIdAndUpdate(id, data, { new: true });
	},
	async remove(id) {
		return Hotel.findByIdAndDelete(id);
	},
};

export default HotelRepository;
