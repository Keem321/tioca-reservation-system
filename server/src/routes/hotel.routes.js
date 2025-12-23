// routes/hotelRoutes.js
import { Router } from "express";
const hotelRouter = Router();
import {
	getHotels,
	createHotel,
	getHotelById,
	updateHotel,
	deleteHotel,
} from "../controllers/hotel.controller.js";

hotelRouter.get("/", getHotels);
hotelRouter.post("/", createHotel);
hotelRouter.get("/:id", getHotelById);
hotelRouter.put("/:id", updateHotel);
hotelRouter.delete("/:id", deleteHotel);
export default hotelRouter;
