import express, { json } from "express";
import { connect } from "mongoose";
import cors from "cors";
require("dotenv").config();

import hotelRoutes from "./routes/hotel.routes";

const app = express();

app.use(cors());
app.use(json());

app.use("/api/hotels", hotelRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI =
	process.env.MONGO_URI || "mongodb://localhost:27017/tioca-reservation-system";

connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err);
	});

export default app;
