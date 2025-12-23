/**
 * Central API Router
 * Aggregates all route modules and applies middleware.
 *
 */

import { Router } from "express";
import hotelRouter from "./hotel.routes.js";
import authRouter from "./auth.js";

// middleware
import passportStateless from "../middleware/passport-stateless.js";

const router = Router();

router.use("/hotels", passportStateless, hotelRouter);
router.use("/auth", authRouter);

export default router;
