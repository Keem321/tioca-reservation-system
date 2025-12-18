// routes/hotelRoutes.js
import { Router } from "express";
const router = Router();
import {
	getHotels,
	createHotel,
	getHotelById,
	updateHotel,
	deleteHotel,
} from "../controllers/hotel.controller.js";

router.get("/", getHotels);
router.post("/", createHotel);
router.get("/:id", getHotelById);
router.put("/:id", updateHotel);
router.delete("/:id", deleteHotel);

export default router;
