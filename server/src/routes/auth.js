import passport from "passport";
import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const authRouter = Router();

authRouter.get(
	"/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
	"/google/callback",
	passport.authenticate("google", {
		failureRedirect: "/login",
	}),
	(req, res) => {
		// Successful authentication, redirect to /auth/loggedin
		res.redirect("/auth/loggedin");
	}
);

// After successful login, show user info
authRouter.get("/loggedin", (req, res) => {
	if (req.isAuthenticated && req.isAuthenticated()) {
		res.json({ message: "Logged in!", user: req.user });
	} else {
		res.status(401).json({ message: "Not logged in" });
	}
});

// User registration route for local strategy
authRouter.post("/register", async (req, res) => {
	const { email, password } = req.body;

	try {
		const encryptedPassword = await bcrypt.hash(password, 10);

		const newUser = new User({ email, password: encryptedPassword });

		// Save the new user to the database (only if not already present)
		await newUser.save();

		res.status(201).json({ message: "User registered successfully" });
	} catch (err) {
		res.status(500).json({ message: "Server error" });
	}
});

export default authRouter;
