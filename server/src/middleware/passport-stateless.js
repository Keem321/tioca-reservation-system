import passport from "passport";

const passportStateless = (req, res, next) => {
	// Extract the authorizatrion header information
	const authHeader = req.headers["authorization"];
	const encodedCredentials = authHeader.split(" ")[1];

	// Decode the base64 encoded credentials
	const [email, password] = Buffer.from(encodedCredentials, "base64")
		.toString()
		.split(":");

	// Use Passport to authenticate the user
	req.body = { email, password }; // set credentials to req.body for passport-local

	passport.authenticate("local", { session: false }, (err, user, info) => {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.status(401).json({ message: "Authentication failed" });
		}
		req.user = user;
		next();
	})(req, res, next);
};

export default passportStateless;
