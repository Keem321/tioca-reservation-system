import Navbar from "../components/landing/Navbar";
import "./About.css";

export default function About() {
	return (
		<>
			<Navbar />
			<div className="about-page">
				<div className="about-container">
					{/* Hero Section */}
					<section className="about-hero">
						<h1>Welcome to Tapioca Capsule Hotel</h1>
						<p>
							Experience the perfect blend of Japanese capsule hotel efficiency
							and modern comfort. Our tapioca-inspired pearl pods provide a
							unique, cozy sanctuary for solo travelers, couples, and business
							guests in the heart of the city.
						</p>
					</section>

					{/* Main Content Sections */}
					<div className="about-content">
						{/* Our Story */}
						<section className="about-section">
							<h2>
								<span className="icon">🏨</span>
								Our Story
							</h2>
							<p>
								Founded with a passion for innovative hospitality, TIOCA
								reimagines the traditional capsule hotel concept with a modern,
								bubble tea-inspired twist. Each pod is thoughtfully designed to
								maximize comfort and functionality while maintaining an
								affordable price point.
							</p>
							<p>
								Our name, TIOCA, is inspired by the beloved tapioca pearls found
								in bubble tea – small, perfectly formed, and surprisingly
								delightful. Just like these pearls, our pods are carefully
								crafted spaces that bring joy to every guest.
							</p>
						</section>

						{/* Our Mission */}
						<section className="about-section">
							<h2>
								<span className="icon">✨</span>
								Our Mission
							</h2>
							<p>
								We're committed to providing exceptional value and comfort for
								modern travelers. Whether you're here for business, leisure, or
								adventure, TIOCA offers a unique stay that doesn't compromise on
								quality or experience.
							</p>
							<p>
								We believe that great accommodations should be accessible to
								everyone, which is why we've created diverse pod options to suit
								every budget and preference – from our Classic Pearl pods to our
								luxurious Crystal Boba Suites.
							</p>
						</section>

						{/* Amenities */}
						<section className="about-section">
							<h2>
								<span className="icon">🎯</span>
								Our Amenities
							</h2>
							<p>Every stay at TIOCA includes access to:</p>
							<ul>
								<li>High-speed Wi-Fi throughout the property</li>
								<li>24/7 front desk service and security</li>
								<li>Modern shared bathrooms with premium toiletries</li>
								<li>Common lounge area with complimentary tea and coffee</li>
								<li>Secure luggage storage</li>
								<li>Laundry facilities</li>
								<li>Quiet hours policy for peaceful rest</li>
								<li>Keyless entry system for enhanced security</li>
							</ul>
						</section>
					</div>

					{/* Pod Quality Information */}
					<section className="about-section" style={{ marginBottom: "var(--spacing-xl)" }}>
						<h2>
							<span className="icon">🫧</span>
							Our Pod Collection
						</h2>
						<p>
							Choose from five unique pod quality levels, each designed with
							specific needs in mind:
						</p>
						<div className="pod-quality-grid">
							<div className="pod-quality-card">
								<h3>Classic Pearl</h3>
								<div className="dimensions">80" × 40" × 40"</div>
								<p className="description">
									Perfect for budget-conscious travelers seeking essential
									comfort and functionality.
								</p>
							</div>
							<div className="pod-quality-card">
								<h3>Milk Pearl</h3>
								<div className="dimensions">84" × 42" × 45"</div>
								<p className="description">
									Enhanced space with upgraded amenities for a more comfortable
									stay.
								</p>
							</div>
							<div className="pod-quality-card">
								<h3>Golden Pearl</h3>
								<div className="dimensions">86" × 45" × 50"</div>
								<p className="description">
									Premium experience with extra room and luxury touches for
									discerning guests.
								</p>
							</div>
							<div className="pod-quality-card">
								<h3>Crystal Boba Suite</h3>
								<div className="dimensions">90" × 55" × 65"</div>
								<p className="description">
									Our first-class offering with maximum space and exclusive
									amenities.
								</p>
							</div>
							<div className="pod-quality-card">
								<h3>Matcha Pearl</h3>
								<div className="dimensions">86" × 45" × 50"</div>
								<p className="description">
									Women-only exclusive pods on a dedicated floor for added
									comfort and security.
								</p>
							</div>
						</div>
					</section>

					{/* Floor Zones */}
					<section className="about-section" style={{ marginBottom: "var(--spacing-xl)" }}>
						<h2>
							<span className="icon">🏢</span>
							Our Floor Zones
						</h2>
						<p>
							TIOCA features four dedicated floors, each designed for specific
							guest preferences:
						</p>
						<div className="features-list">
							<div className="feature-item">
								<div className="icon">👩</div>
								<h4>Women-Only Floor</h4>
								<p>Exclusive floor 1 with enhanced privacy and security</p>
							</div>
							<div className="feature-item">
								<div className="icon">👨</div>
								<h4>Men-Only Floor</h4>
								<p>Dedicated floor 2 for male guests</p>
							</div>
							<div className="feature-item">
								<div className="icon">💑</div>
								<h4>Couples Floor</h4>
								<p>Floor 3 designed for couples and duos</p>
							</div>
							<div className="feature-item">
								<div className="icon">💼</div>
								<h4>Business Floor</h4>
								<p>Floor 4 with workstation amenities for professionals</p>
							</div>
						</div>
					</section>

					{/* Policies Section */}
					<section className="policies-section">
						<h2>Policies & Information</h2>
						<div className="policies-grid">
							<div className="policy-card">
								<h3>Check-In & Check-Out</h3>
								<p>
									<strong>Check-in:</strong> 3:00 PM onwards
								</p>
								<p>
									<strong>Check-out:</strong> 11:00 AM
								</p>
								<p>
									Early check-in or late check-out may be available upon request
									and subject to availability.
								</p>
							</div>
							<div className="policy-card">
								<h3>Cancellation Policy</h3>
								<p>
									Free cancellation up to 48 hours before check-in. Cancellations
									made within 48 hours of check-in are subject to a one-night
									charge.
								</p>
								<p>
									Special rates and group bookings may have different cancellation
									policies.
								</p>
							</div>
							<div className="policy-card">
								<h3>House Rules</h3>
								<p>
									• Quiet hours: 10:00 PM - 7:00 AM
									<br />
									• No smoking in pods or common areas
									<br />
									• Maximum 2 guests per pod
									<br />
									• Valid ID required at check-in
									<br />
									• Respect fellow guests' privacy
								</p>
							</div>
							<div className="policy-card">
								<h3>Legal Documents</h3>
								<p>
									Please review our policies before booking:
								</p>
								<p>
									<a href="/privacy">Privacy Policy</a>
								</p>
								<p>
									<a href="/terms">Terms & Conditions</a>
								</p>
							</div>
						</div>
					</section>

					{/* Contact Section */}
					<section className="contact-section">
						<h2>Get in Touch</h2>
						<p>
							Questions or feedback? We'd love to hear from you! Reach out via
							the contact form on our booking page, or speak with our friendly
							front desk team during your stay.
						</p>
						<div className="contact-info">
							<div className="contact-item">
								<div className="icon">📧</div>
								<strong>Email</strong>
								<span>hello@tioca-hotel.com</span>
							</div>
							<div className="contact-item">
								<div className="icon">📞</div>
								<strong>Phone</strong>
								<span>Available 24/7 at Reception</span>
							</div>
							<div className="contact-item">
								<div className="icon">🕐</div>
								<strong>Front Desk</strong>
								<span>24 Hours, 7 Days a Week</span>
							</div>
						</div>
					</section>
				</div>
			</div>
		</>
	);
}
