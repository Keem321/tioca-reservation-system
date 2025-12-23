import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
	const { email, password } = req.body;

	try {
		const encryptedPassword = await bcrypt.hash(password, 10);

		const newUser = new User({ email, password: encryptedPassword });

		// Save the new user to the database
		await newUser.save();

		res.status(201).json({ message: "User registered successfully" });
	} catch (err) {
		res.status(500).json({ message: "Server error" });
	}
});

export default authRouter;
