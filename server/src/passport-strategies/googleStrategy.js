import dotenv from "dotenv";
import fs from "fs";
if (fs.existsSync(".env.development")) {
	dotenv.config({ path: ".env.development" });
} else {
	dotenv.config();
}
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import passport from "passport";

const googleStrategy = new GoogleStrategy(
	{
		scope: ["profile", "email"],
		clientID: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		callbackURL: process.env.GOOGLE_CALLBACK_URL,
	},
	async (accessToken, refreshToken, profile, done) => {
		try {
			// Use findOneAndUpdate to avoid duplicate key errors
			const user = await User.findOneAndUpdate(
				{ googleId: profile.id },
				{
					$setOnInsert: {
						googleId: profile.id,
						email: profile.emails[0].value,
						name: profile.displayName,
					},
				},
				{ new: true, upsert: true }
			);
			return done(null, user);
		} catch (err) {
			return done(err);
		}
	}
);

passport.use(googleStrategy);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (user, done) => {
	done(null, user);
});

export default googleStrategy;
