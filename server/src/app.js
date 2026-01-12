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
import holdCleanupService from "./services/holdCleanup.service.js";
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI =
	process.env.MONGO_URI || "mongodb://localhost:27017/tioca-reservation-system";

// Middleware
// Allow cross-origin requests from the client and include credentials (cookies)
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(cors({ 
	origin: clientOrigin, 
	credentials: true,
	allowedHeaders: ['Content-Type', 'Authorization'],
	exposedHeaders: ['set-cookie']
}));
app.use(json());

// Always set trust proxy (harmless in local dev, needed behind AWS Beanstalk/CloudFront)
app.set("trust proxy", 1);

// Session setup - detect secure mode by checking if CLIENT_ORIGIN is HTTPS
const isSecureEnv =
	process.env.CLIENT_ORIGIN && process.env.CLIENT_ORIGIN.startsWith("https");
app.use(
	session({
		secret: process.env.SESSION_SECRET || "tioca-session-secret-2026",
		name: "tioca.sid", // Custom session cookie name
		resave: false,
		saveUninitialized: true, // Create session even if not modified (important for holds)
		cookie: {
			secure: isSecureEnv,
			sameSite: isSecureEnv ? "none" : "lax",
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
	})
);
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware - log session info
app.use((req, res, next) => {
	console.log(`[Session] ${req.method} ${req.path} - Session ID: ${req.sessionID}`);
	next();
});

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
		
		// Start the hold cleanup service after successful DB connection
		holdCleanupService.start();
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

// Global error handlers to prevent the server from exiting unexpectedly
process.on("unhandledRejection", (reason, p) => {
	console.error("Unhandled Rejection at:", p, "reason:", reason);
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	// Always log and do not exit
});

// Graceful shutdown handlers
process.on("SIGINT", () => {
	console.log("\nReceived SIGINT, shutting down gracefully...");
	holdCleanupService.stop();
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("\nReceived SIGTERM, shutting down gracefully...");
	holdCleanupService.stop();
	process.exit(0);
});

export default app;
