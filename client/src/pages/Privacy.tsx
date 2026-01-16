import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import "./Privacy.css";

/**
 * Privacy Policy Page
 * 
 * Displays TIOCA's privacy policy and data handling practices
 */
const Privacy: React.FC = () => {
	return (
		<div className="privacy-page">
			<Navbar />
			<div className="privacy-page__container">
				<div className="privacy-page__content">
					<h1 className="privacy-page__title">Privacy Policy</h1>
					<p className="privacy-page__updated">Last Updated: January 2026</p>

					<section className="privacy-section">
						<h2>Introduction</h2>
						<p>
							Welcome to TIOCA (Tapioca Pod Hotel). We are committed to protecting your privacy and
							ensuring the security of your personal information. This Privacy Policy explains how we
							collect, use, disclose, and safeguard your information when you visit our website and
							use our services.
						</p>
					</section>

					<section className="privacy-section">
						<h2>Information We Collect</h2>
						<h3>Personal Information</h3>
						<p>
							When you make a reservation at TIOCA, we collect personal information including but not
							limited to:
						</p>
						<ul>
							<li>Full name and contact details (email, phone number)</li>
							<li>Payment information (processed securely through our payment provider)</li>
							<li>Booking preferences and special requests</li>
							<li>Account credentials if you create an account</li>
						</ul>

						<h3>Automatically Collected Information</h3>
						<p>
							We automatically collect certain information when you visit our website, including:
						</p>
						<ul>
							<li>IP address and browser type</li>
							<li>Device information and operating system</li>
							<li>Pages visited and time spent on our site</li>
							<li>Referring website addresses</li>
						</ul>
					</section>

					<section className="privacy-section">
						<h2>How We Use Your Information</h2>
						<p>
							We use the information we collect to:
						</p>
						<ul>
							<li>Process and manage your reservations</li>
							<li>Send booking confirmations and important updates</li>
							<li>Improve our services and website functionality</li>
							<li>Respond to your inquiries and provide customer support</li>
							<li>Send promotional materials (only with your consent)</li>
							<li>Comply with legal obligations and prevent fraud</li>
						</ul>
					</section>

					<section className="privacy-section">
						<h2>Information Sharing and Disclosure</h2>
						<p>
							We do not sell your personal information. We may share your information with:
						</p>
						<ul>
							<li>
								<strong>Service Providers:</strong> Third-party companies that help us operate our
								business (payment processors, email services, etc.)
							</li>
							<li>
								<strong>Legal Requirements:</strong> When required by law or to protect our rights
								and safety
							</li>
							<li>
								<strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale
								of assets
							</li>
						</ul>
					</section>

					<section className="privacy-section">
						<h2>Data Security</h2>
						<p>
							We implement appropriate technical and organizational measures to protect your personal
							information against unauthorized access, alteration, disclosure, or destruction. However,
							no method of transmission over the internet is 100% secure, and we cannot guarantee
							absolute security.
						</p>
						<p>
							Your payment information is processed securely through our PCI-compliant payment provider
							and is never stored on our servers.
						</p>
					</section>

					<section className="privacy-section">
						<h2>Your Rights</h2>
						<p>
							You have the right to:
						</p>
						<ul>
							<li>Access the personal information we hold about you</li>
							<li>Request correction of inaccurate information</li>
							<li>Request deletion of your personal information</li>
							<li>Object to processing of your personal information</li>
							<li>Request restriction of processing your personal information</li>
							<li>Data portability (receive your information in a structured format)</li>
							<li>Withdraw consent at any time</li>
						</ul>
						<p>
							To exercise these rights, please contact us at{" "}
							<a href="mailto:privacy@tioca.com">privacy@tioca.com</a>.
						</p>
					</section>

					<section className="privacy-section">
						<h2>Cookies and Tracking Technologies</h2>
						<p>
							We use cookies and similar tracking technologies to enhance your experience on our
							website. Cookies help us remember your preferences, understand how you use our site,
							and improve our services.
						</p>
						<p>
							You can control cookies through your browser settings. However, disabling cookies may
							affect the functionality of our website.
						</p>
					</section>

					<section className="privacy-section">
						<h2>Children's Privacy</h2>
						<p>
							Our services are not directed to individuals under the age of 18. We do not knowingly
							collect personal information from children. If you believe we have collected information
							from a child, please contact us immediately.
						</p>
					</section>

					<section className="privacy-section">
						<h2>International Data Transfers</h2>
						<p>
							TIOCA is located in Japan. If you are accessing our services from outside Japan, please
							be aware that your information may be transferred to, stored, and processed in Japan or
							other countries where our service providers are located.
						</p>
					</section>

					<section className="privacy-section">
						<h2>Changes to This Privacy Policy</h2>
						<p>
							We may update this Privacy Policy from time to time to reflect changes in our practices
							or for legal, operational, or regulatory reasons. We will notify you of any material
							changes by posting the new Privacy Policy on this page and updating the "Last Updated"
							date.
						</p>
					</section>

					<section className="privacy-section">
						<h2>Contact Us</h2>
						<p>
							If you have any questions about this Privacy Policy or our privacy practices, please
							contact us:
						</p>
						<ul className="contact-info">
							<li>
								<strong>Email:</strong> <a href="mailto:privacy@tioca.com">privacy@tioca.com</a>
							</li>
							<li>
								<strong>Mail:</strong> TIOCA Pod Hotel, 3-14-8 Kabukicho, Shinjuku-ku, Tokyo
								160-0021, Japan
							</li>
							<li>
								<strong>Support:</strong> <a href="mailto:support@tioca.com">support@tioca.com</a>
							</li>
						</ul>
					</section>

					<div className="privacy-page__footer-links">
						<Link to="/" className="footer-link">
							Back to Home
						</Link>
						<Link to="/terms" className="footer-link">
							Terms of Service
						</Link>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default Privacy;
