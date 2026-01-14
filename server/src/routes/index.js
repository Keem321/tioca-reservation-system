/**
 * Central API Router
 * Aggregates all route modules and applies middleware.
 *
 */
import passport from "passport";
import { Router } from "express";
import roomRouter from "./room.routes.js";
import reservationRouter from "./reservation.routes.js";
import userRouter from "./user.routes.js";
import paymentRouter from "./payment.routes.js";
import holdRouter from "./hold.routes.js";
import offeringRouter from "./offering.routes.js";
import authRouter from "./auth.js";
import { sessionActivityMiddleware } from "../middleware/sessionActivity.js";

// middleware MUST import strategies to register them with passport
import "../passport-strategies/googleStrategy.js";
import "../passport-strategies/localStrategy.js";

// API router (for /api/*)
const apiRouter = Router();

// Apply session activity tracking middleware to all API routes
// This enforces server-side inactivity timeout for authenticated users
apiRouter.use(sessionActivityMiddleware);

apiRouter.use("/rooms", roomRouter);
apiRouter.use("/reservations", reservationRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/holds", holdRouter);
apiRouter.use("/offerings", offeringRouter);
apiRouter.use("/auth", authRouter); // Auth routes now under /api/auth

// Public router (for non-API routes like health check)
const publicRouter = Router();
publicRouter.get("/open", (req, res) => {
	res.status(200).json({ message: "This is an open route." });
});

export { apiRouter, publicRouter };
