// routes/hotelRoutes.js
const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotel.controller");

router.get("/", hotelController.getHotels);
router.post("/", hotelController.createHotel);
router.get("/:id", hotelController.getHotelById);
router.put("/:id", hotelController.updateHotel);
router.delete("/:id", hotelController.deleteHotel);

module.exports = router;
