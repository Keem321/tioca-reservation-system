import React from "react";
import "./Footer.css";

/**
 * Footer Component
 *
 * Footer section with links and contact information.
 */
const Footer: React.FC = () => {
	const quickLinks = ["About Us", "Contact", "FAQ", "Policies"];

	return (
		<footer className="footer">
			<div className="footer__container">
				<div className="footer__section">
					<h4 className="footer__heading">Tapioca</h4>
					<p className="footer__text">Modern rest for the mindful traveler</p>
				</div>
				<div className="footer__section">
					<h4 className="footer__heading">Quick Links</h4>
					<div className="footer__links">
						{quickLinks.map((link) => (
							<a key={link} href="#" className="footer__link">
								{link}
							</a>
						))}
					</div>
				</div>
				<div className="footer__section">
					<h4 className="footer__heading">Contact</h4>
					<p className="footer__text">
						3-14-8 Kabukicho, Shinjuku-ku
						<br />
						Tokyo 160-0021, Japan
						<br />
						<br />
						hello@tapioca.com
						<br />
						+81 (3) 1234-5678
					</p>
				</div>
			</div>
			<div className="footer__copyright">
				© 2026 Tapioca. All rights reserved.
			</div>
		</footer>
	);
};

export default Footer;
