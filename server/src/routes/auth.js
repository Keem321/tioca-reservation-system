import passport from "passport";
import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const authRouter = Router();

authRouter.get(
	"/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get("/google/callback", (req, res, next) => {
	// Use a custom callback to avoid passport's req.logIn(session-regenerate)
	// which has caused crashes in dev when req.session is undefined.
	passport.authenticate(
		"google",
		{ failureRedirect: "/login", session: false },
		async (err, user) => {
			if (err) return next(err);
			if (!user) return res.redirect("/login");

			// Ensure session exists, then attach the passport user id so
			// passport.session middleware can later deserialize it.
			if (!req.session) {
				req.session = {};
			}
			req.session.passport = { user: user.id };

			console.log(`OAuth callback: attached user ${user.id} to session`);
			const clientHome = process.env.CLIENT_HOME_URL || "http://localhost:5173";
			const redirectPath = req.query.redirect || "/";
			return res.redirect(clientHome + redirectPath);
		}
	)(req, res, next);
});

// Route to check if user is logged in
authRouter.get("/loggedin", (req, res) => {
	if (req.isAuthenticated && req.isAuthenticated()) {
		// Return minimal session info to the frontend so UI can confirm OAuth worked
		const user = req.user
			? {
					id: req.user._id || req.user.id,
					name: req.user.name,
					email: req.user.email,
					role: req.user.role || "user",
			  }
			: null;
		res.json({ message: "Logged in!", user });
	} else {
		res.status(401).json({ message: "Not logged in" });
	}
});

// Logout route - destroys session and clears cookie
authRouter.post("/logout", (req, res) => {
	// Use callback form for req.logout and destroy the session afterwards.
	if (req.logout) {
		return req.logout(function (err) {
			if (err) {
				return res.status(500).json({ message: "Error logging out" });
			}
			req.session?.destroy((destroyErr) => {
				res.clearCookie("connect.sid");
				if (destroyErr)
					return res.status(500).json({ message: "Error logging out" });
				res.json({ message: "Logged out" });
			});
		});
	}
	// Fallback: no passport logout available
	req.session?.destroy((err) => {
		res.clearCookie("connect.sid");
		if (err) return res.status(500).json({ message: "Error logging out" });
		res.json({ message: "Logged out" });
	});
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

// Local strategy login (management users)
authRouter.post("/login", (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) return next(err);
		if (!user) {
			return res
				.status(401)
				.json({ message: info?.message || "Invalid credentials" });
		}
		req.login(user, (loginErr) => {
			if (loginErr) return next(loginErr);
			const safeUser = {
				id: user._id,
				email: user.email,
				name: user.name,
				role: user.role || "user",
			};
			return res.json({ message: "Logged in", user: safeUser });
		});
	})(req, res, next);
});

export default authRouter;
