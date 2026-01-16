import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import "./Terms.css";

/**
 * Terms of Service Page
 * 
 * Displays TIOCA's terms and conditions for using the service
 */
const Terms: React.FC = () => {
	return (
		<div className="terms-page">
			<Navbar />
			<div className="terms-page__container">
				<div className="terms-page__content">
					<h1 className="terms-page__title">Terms of Service</h1>
					<p className="terms-page__updated">Last Updated: January 2026</p>

					<section className="terms-section">
						<h2>Agreement to Terms</h2>
						<p>
							By accessing and using the TIOCA (Tapioca Pod Hotel) website and services, you agree to
							be bound by these Terms of Service and all applicable laws and regulations. If you do
							not agree with any of these terms, you are prohibited from using our services.
						</p>
					</section>

					<section className="terms-section">
						<h2>Reservation and Booking</h2>
						<h3>Booking Process</h3>
						<p>
							When you make a reservation at TIOCA, you enter into a binding agreement with us. All
							reservations are subject to availability and confirmation. We reserve the right to
							refuse service to anyone for any reason at any time.
						</p>

						<h3>Payment Terms</h3>
						<ul>
							<li>Full payment is required at the time of booking</li>
							<li>All prices are displayed in USD</li>
							<li>Payment is processed securely through our payment provider</li>
							<li>We accept major credit cards and debit cards</li>
							<li>Prices are subject to change without notice</li>
						</ul>

						<h3>Booking Modifications</h3>
						<p>
							Modifications to your reservation are subject to availability and may incur additional
							charges. Please contact us at <a href="mailto:support@tioca.com">support@tioca.com</a>{" "}
							to request changes to your booking.
						</p>
					</section>

					<section className="terms-section">
						<h2>Cancellation Policy</h2>
						<h3>Standard Cancellation</h3>
						<ul>
							<li>Free cancellation up to 24 hours before check-in time</li>
							<li>Cancellations within 24 hours of check-in will incur a one-night charge</li>
							<li>No-shows will be charged the full reservation amount</li>
							<li>Refunds are processed within 5-10 business days</li>
						</ul>

						<h3>Non-Refundable Bookings</h3>
						<p>
							Special promotional rates and discounted bookings may be non-refundable. These terms
							will be clearly stated at the time of booking.
						</p>
					</section>

					<section className="terms-section">
						<h2>Check-in and Check-out</h2>
						<h3>Check-in</h3>
						<ul>
							<li>Standard check-in time: 3:00 PM</li>
							<li>Early check-in is subject to availability and may incur additional charges</li>
							<li>Valid government-issued photo ID required at check-in</li>
							<li>Contactless check-in available through our automated kiosk system</li>
							<li>Digital key cards are issued upon check-in</li>
						</ul>

						<h3>Check-out</h3>
						<ul>
							<li>Standard check-out time: 11:00 AM</li>
							<li>Late check-out is subject to availability and may incur additional charges</li>
							<li>Please return key cards and clear all personal belongings from your pod</li>
							<li>Luggage storage available for guests who check out early</li>
						</ul>
					</section>

					<section className="terms-section">
						<h2>House Rules and Guest Conduct</h2>
						<h3>Pod Facilities</h3>
						<ul>
							<li>Remove shoes before entering pod areas (designated storage provided)</li>
							<li>Maintain cleanliness and respect shared facilities</li>
							<li>No smoking anywhere in the facility</li>
							<li>No pets allowed (service animals excepted)</li>
							<li>Maximum occupancy per pod must be respected</li>
						</ul>

						<h3>Quiet Hours</h3>
						<p>
							Quiet hours are observed from 10:00 PM to 7:00 AM. During this time, guests are
							expected to keep noise to a minimum to respect other guests' rest. Violations may
							result in removal from the property without refund.
						</p>

						<h3>Floor-Specific Rules</h3>
						<ul>
							<li>
								<strong>Women-Only Floor:</strong> Access restricted to female guests only
							</li>
							<li>
								<strong>Men-Only Floor:</strong> Access restricted to male guests only
							</li>
							<li>
								<strong>Couples Floor:</strong> Available for couples and families
							</li>
							<li>
								<strong>Business Floor:</strong> Enhanced quiet policies and work-friendly
								environment
							</li>
						</ul>
					</section>

					<section className="terms-section">
						<h2>Liability and Damages</h2>
						<h3>Property Damage</h3>
						<p>
							Guests are responsible for any damage caused to the pod or hotel property during their
							stay. Charges for damages will be assessed and charged to the payment method on file.
						</p>

						<h3>Personal Belongings</h3>
						<p>
							TIOCA is not responsible for any loss, theft, or damage to personal belongings. We
							provide secure lockers for valuables, and we recommend guests use them. Items left
							behind after check-out will be held for 30 days before disposal.
						</p>

						<h3>Limitation of Liability</h3>
						<p>
							TIOCA shall not be liable for any indirect, incidental, special, consequential, or
							punitive damages arising from your use of our services or facilities. Our total
							liability shall not exceed the amount paid for your reservation.
						</p>
					</section>

					<section className="terms-section">
						<h2>Age Requirements</h2>
						<p>
							Guests must be at least 18 years old to make a reservation and check in. Minors must be
							accompanied by a parent or legal guardian. Valid identification will be verified at
							check-in.
						</p>
					</section>

					<section className="terms-section">
						<h2>Right to Refuse Service</h2>
						<p>
							We reserve the right to refuse service or terminate a guest's stay at our sole
							discretion for reasons including but not limited to:
						</p>
						<ul>
							<li>Violation of house rules or terms of service</li>
							<li>Disruptive or threatening behavior</li>
							<li>Illegal activities</li>
							<li>Damage to property</li>
							<li>Failure to provide valid identification</li>
						</ul>
						<p>No refunds will be provided for terminations due to guest misconduct.</p>
					</section>

					<section className="terms-section">
						<h2>Force Majeure</h2>
						<p>
							TIOCA is not liable for any failure or delay in performance due to circumstances beyond
							our reasonable control, including but not limited to natural disasters, pandemics,
							government actions, or utility failures. In such events, we will work with guests to
							reschedule or provide refunds as appropriate.
						</p>
					</section>

					<section className="terms-section">
						<h2>Intellectual Property</h2>
						<p>
							All content on the TIOCA website, including text, graphics, logos, images, and software,
							is the property of TIOCA or its licensors and is protected by copyright and trademark
							laws. Unauthorized use of any content is prohibited.
						</p>
					</section>

					<section className="terms-section">
						<h2>Changes to Terms</h2>
						<p>
							We reserve the right to modify these Terms of Service at any time. Changes will be
							effective immediately upon posting on our website. Continued use of our services after
							changes constitutes acceptance of the modified terms.
						</p>
					</section>

					<section className="terms-section">
						<h2>Governing Law</h2>
						<p>
							These Terms of Service are governed by and construed in accordance with the laws of
							Japan. Any disputes arising from these terms or your use of our services shall be
							subject to the exclusive jurisdiction of the courts of Tokyo, Japan.
						</p>
					</section>

					<section className="terms-section">
						<h2>Contact Information</h2>
						<p>
							For questions about these Terms of Service or any other inquiries, please contact us:
						</p>
						<ul className="contact-info">
							<li>
								<strong>Email:</strong> <a href="mailto:support@tioca.com">support@tioca.com</a>
							</li>
							<li>
								<strong>Mail:</strong> TIOCA Pod Hotel, 3-14-8 Kabukicho, Shinjuku-ku, Tokyo
								160-0021, Japan
							</li>
							<li>
								<strong>Phone:</strong> Available during business hours (9:00 AM - 6:00 PM JST)
							</li>
						</ul>
					</section>

					<div className="terms-page__footer-links">
						<Link to="/" className="footer-link">
							Back to Home
						</Link>
						<Link to="/privacy" className="footer-link">
							Privacy Policy
						</Link>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default Terms;
