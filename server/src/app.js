/**
 * Server Entry Point
 *
 */

import express, { json } from "express";
import { connect } from "mongoose";
import cors from "cors";
import apiRouter from "./routes/index.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI =
	process.env.MONGO_URI || "mongodb://localhost:27017/tioca-reservation-system";

// Middleware
app.use(cors());
app.use(json());

// Routes
app.use("/api", apiRouter);

// Connect to MongoDB and start server
connect(MONGO_URI)
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err);
	});

export default app;
