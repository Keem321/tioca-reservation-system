import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import passport from "passport";
import User from "../models/user.model.js";

const localStrategy = new LocalStrategy(
	{
		usernameField: "email",
		passwordField: "password",
	},
	async (email, password, done) => {
		try {
			const user = await User.findOne({ email });
			if (!user) {
				return done(null, false, { message: "User not found." });
			}
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return done(null, false, { message: "Incorrect password." });
			}
			return done(null, user);
		} catch (err) {
			return done(err);
		}
	}
);

passport.use(localStrategy);

export default localStrategy;
