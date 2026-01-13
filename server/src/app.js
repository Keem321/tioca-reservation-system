/**
 * Server Entry Point
 *
 */

import express, { json } from "express";
// must setup sessions when using passport OAuth strategies by default -- it can be done statelessly with more config
import session from "express-session";
import MongoStore from "connect-mongo";

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
console.log(`[CORS] Configured with origin: ${clientOrigin}`);

app.use(
	cors({
		origin: clientOrigin,
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"],
		exposedHeaders: ["set-cookie"],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	})
);

app.use(json());

// Trust the entire proxy chain (CloudFront -> ALB -> Nginx) so req.secure is accurate
app.set("trust proxy", true);

// Proxy-chain secure override: when behind multi-hop proxies (e.g., CloudFront -> ALB),
// req.secure may be false even for HTTPS requests. Override it to match CLIENT_ORIGIN protocol.
app.use((req, res, next) => {
	const xForwardedFor = req.headers["x-forwarded-for"];
	if (xForwardedFor && xForwardedFor.split(",").length >= 2) {
		const isHttpsOrigin = clientOrigin.startsWith("https://");
		if (isHttpsOrigin && !req.secure) {
			// Override read-only req.secure property to enable secure session cookies
			Object.defineProperty(req, "secure", {
				value: true,
				writable: false,
				configurable: true,
			});
		}
	}
	next();
});

// Request logging middleware
app.use((req, res, next) => {
	if (req.path !== "/health") {
		console.log(`[REQUEST] ${req.method} ${req.path}`);
	}
	next();
});

// Session setup: configure secure cookies for HTTPS environments
const isSecureEnv = clientOrigin.startsWith("https://");

// Conditionally apply TLS settings for AWS DocumentDB (not localhost)
const useDocDBTls =
	process.env.DOCDB_TLS === "true" ||
	/ssl=true|tls=true/i.test(MONGO_URI || "");

const sessionStore = new MongoStore({
	mongoUrl: MONGO_URI,
	touchAfter: 24 * 3600, // lazy session update interval (seconds)
	mongoOptions: useDocDBTls
		? {
				// Allow TLS connections without strict certificate validation
				// (required for AWS DocumentDB)
				tls: true,
				tlsAllowInvalidCertificates: true,
		  }
		: {},
});

// Monitor session store connection
sessionStore.on?.("error", (err) =>
	console.error("[Session Store] error:", err)
);

app.use(
	session({
		store: sessionStore,
		secret: process.env.SESSION_SECRET || "tioca-session-secret-2026",
		name: "tioca.sid", // Custom session cookie name
		resave: false,
		saveUninitialized: false, // Only create session when user modifies it
		cookie: {
			secure: isSecureEnv, // https only in production
			sameSite: isSecureEnv ? "none" : "lax", // "none" required for cross-site HTTPS cookies (CloudFront)
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
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

// Centralized error handler (ensures JSON + logs)
// Note: keep this after all routes
app.use((err, req, res, _next) => {
	console.error(
		`[Error] ${req.method} ${req.originalUrl}:`,
		err?.message,
		err?.stack?.split("\n").slice(0, 3).join(" | ")
	);
	if (!res.headersSent) {
		res
			.status(err.status || 500)
			.json({ message: err.message || "Server error" });
	}
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
