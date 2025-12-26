/**
 * Central API Router
 * Aggregates all route modules and applies middleware.
 *
 */
import passport from "passport";
import { Router } from "express";
import hotelRouter from "./hotel.routes.js";
import authRouter from "./auth.js";

// middleware MUST import strategies to register them with passport
import "../passport-strategies/googleStrategy.js";

// API router (for /api/*)
const apiRouter = Router();
apiRouter.use("/hotels", hotelRouter);

// Public router (for non-API routes)
const publicRouter = Router();
publicRouter.use("/auth", authRouter);
publicRouter.get("/open", (req, res) => {
	res.status(200).json({ message: "This is an open route." });
});

export { apiRouter, publicRouter };
