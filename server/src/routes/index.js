/**
 * Central API Router
 * Aggregates all route modules and applies middleware.
 *
 */

import express from "express";
// middleware

import hotelRoutes from "./hotel.routes.js";

const router = express.Router();

// Public routes

// Authetification middleware

// Protected routes
router.use("/hotels", hotelRoutes);

export default router;
