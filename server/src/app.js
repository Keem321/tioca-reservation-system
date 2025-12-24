/**
 * Server Entry Point
 *
 */

import express, { json } from "express";
import { connect } from "mongoose";
import cors from "cors";
import apiRouter from "./routes/index.js";
import dotenv from "dotenv";
import passport from "passport";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI =
	process.env.MONGO_URI || "mongodb://localhost:27017/tioca-reservation-system";

// Middleware
app.use(cors());
app.use(json());
app.use(passport.initialize());

// Health check endpoint for deployment verification
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api", apiRouter);

// DocumentDB/MongoDB connection options
const mongoOptions = {};
if (process.env.DOCDB_TLS === "true") {
	mongoOptions.tls = true;
	mongoOptions.retryWrites = false;
	if (process.env.DOCDB_CA_PATH) {
		mongoOptions.tlsCAFile = process.env.DOCDB_CA_PATH;
	}
}

// Try to connect to MongoDB/DocumentDB, but always start server for health check
connect(MONGO_URI, mongoOptions)
	.then(() => {
		console.log("MongoDB connected successfully");
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err);
		console.log(
			"Starting server without database connection for health check."
		);
	})
	.finally(() => {
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	});

export default app;
