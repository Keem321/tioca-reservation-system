// Checks if user is authenticated
// If not, redirects them to the google OAuth login
const passportGoogleAuth = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/auth/google");
};
