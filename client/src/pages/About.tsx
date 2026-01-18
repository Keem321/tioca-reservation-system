import Navbar from "../components/landing/Navbar";
import "./Landing.css";

export default function About() {
	return (
		<>
			<Navbar />
			<div className="landing-container" style={{ paddingTop: "96px" }}>
				<section style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
					<h1>About Tapioca Capsule Hotel</h1>
					<p style={{ marginTop: "1rem" }}>
						We craft efficient, comfortable capsule stays with thoughtful
						amenities for solo travelers, couples, and business guests. Our
						rooms range from Classic to Crystal suites, with dedicated
						women-only and couples floors.
					</p>

					<h2 style={{ marginTop: "2rem" }}>Policies & Information</h2>
					<ul style={{ marginTop: "0.75rem" }}>
						<li>
							<a href="/privacy">Privacy Policy</a>
						</li>
						<li>
							<a href="/terms">Terms & Conditions</a>
						</li>
					</ul>

					<h2 style={{ marginTop: "2rem" }}>Contact</h2>
					<p>
						Questions or feedback? Reach us via the contact form on the booking
						page or during your stay with our front desk.
					</p>
				</section>
			</div>
		</>
	);
}
