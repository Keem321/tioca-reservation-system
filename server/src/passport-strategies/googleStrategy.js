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
			const email = profile.emails?.[0]?.value;

			// 1) Try to find by providerId first (user previously logged in via Google)
			let user = await User.findOne({
				provider: "google",
				providerId: profile.id,
			});
			if (user) {
				user.lastLogin = new Date();
				await user.save();
				return done(null, user);
			}

			// 2) If not found by providerId, try to find by email (user may have registered locally)
			if (email) {
				user = await User.findOne({ email });
				if (user) {
					// Attach provider info to the existing account and update lastLogin
					user.provider = "google";
					user.providerId = profile.id;
					user.lastLogin = new Date();
					await user.save();
					return done(null, user);
				}
			}

			// 3) No existing user found -> create a new one
			const newUser = new User({
				provider: "google",
				providerId: profile.id,
				email,
				name: profile.displayName,
				lastLogin: new Date(),
			});
			try {
				await newUser.save();
				return done(null, newUser);
			} catch (saveErr) {
				// Handle rare race / duplicate-key: if a user with this email was created concurrently,
				// return that existing user instead of failing the OAuth flow.
				if (saveErr && saveErr.code === 11000 && email) {
					try {
						const existing = await User.findOne({ email });
						if (existing) {
							existing.lastLogin = new Date();
							await existing.save();
							return done(null, existing);
						}
					} catch (e) {
						return done(e);
					}
				}
				return done(saveErr);
			}
		} catch (err) {
			return done(err);
		}
	}
);

passport.use(googleStrategy);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (err) {
		done(err);
	}
});

export default googleStrategy;
