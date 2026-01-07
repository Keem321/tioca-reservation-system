import { Router } from "express";
import UserController from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/roleAuth.js";

const userRouter = Router();

// All user routes require authentication
userRouter.use(requireAuth);

/**
 * Get current user's profile
 * @route GET /api/user/profile
 */
userRouter.get("/profile", UserController.getProfile);

/**
 * Update current user's profile (name, email)
 * @route PUT /api/user/profile
 */
userRouter.put("/profile", UserController.updateProfile);

/**
 * Change user password
 * @route POST /api/user/change-password
 */
userRouter.post("/change-password", UserController.changePassword);

/**
 * Get user's active/upcoming reservations
 * @route GET /api/user/active-reservations
 */
userRouter.get("/active-reservations", UserController.getActiveReservations);

export default userRouter;
