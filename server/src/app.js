/**
 * Server Entry Point
 *
 */

import express, { json } from "express";
// must setup sessions when using passport OAuth strategies by default -- it can be done statelessly with more config
import session from "express-session";

import { connect } from "mongoose";
import fs from "fs";
import path from "path";
import cors from "cors";
import { apiRouter, publicRouter } from "./routes/index.js";
import passport from "passport";
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI =
	process.env.MONGO_URI || "mongodb://localhost:27017/tioca-reservation-system";

// Middleware
app.use(cors());
app.use(json());

// Session setup
app.use(
	session({
		secret: process.env.SESSION_SECRET || "default_secret",
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint for deployment verification
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// API resource routes
app.use("/api", apiRouter);
// Public and auth routes
app.use("/", publicRouter);

// DocumentDB/MongoDB connection options
const mongoOptions = {
	// sensible defaults for server selection and socket timeouts
	serverSelectionTimeoutMS: 30000,
	socketTimeoutMS: 45000,
};

const useDocDBTls =
	process.env.DOCDB_TLS === "true" ||
	/ssl=true|tls=true/i.test(MONGO_URI || "");
if (useDocDBTls) {
	mongoOptions.tls = true;
	mongoOptions.retryWrites = false;

	// Use CA bundle committed in repo for AWS DocumentDB TLS
	const caPath = path.resolve("./global-bundle.pem");
	if (fs.existsSync(caPath)) {
		mongoOptions.tlsCAFile = caPath;
		console.log(`Using DocumentDB CA file at ${caPath}`);
	} else {
		console.warn(
			`Expected CA bundle at '${caPath}' but file was not found. TLS trust may fail.`
		);
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
