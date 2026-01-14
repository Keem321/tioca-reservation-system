import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetRoomOfferingsQuery } from "../../features/offeringsApi";
import { formatMoney } from "../../utils/money";
import "./RoomsSection.css";

/**
 * RoomsSection Component
 *
 * Displays capsule type showcase for advertising purposes.
 * All data (name, description, features, pricing, images) is fetched dynamically from the offerings API.
 * Updates to offerings in the database automatically reflect here.
 */
const RoomsSection: React.FC = () => {
	const navigate = useNavigate();
	const { data: roomOfferings = [] } = useGetRoomOfferingsQuery({
		activeOnly: true,
	});

	const handleBookNow = () => {
		navigate("/booking");
	};

	return (
		<section id="rooms" className="rooms-section">
			<div className="rooms-section__container">
				<h2 className="rooms-section__title">Our Capsules</h2>
				<p className="rooms-section__subtitle">
					Choose from our range of thoughtfully designed capsule accommodations
				</p>

				<div className="rooms-section__grid">
					{roomOfferings.map((offering) => (
						<div key={offering._id} className="rooms-section__card">
							<div className="rooms-section__card-image-wrapper">
								{offering.imageUrl && (
									<img
										src={offering.imageUrl}
										alt={offering.name}
										className="rooms-section__card-image"
										onError={(e) => {
											// Fallback if image doesn't exist
											e.currentTarget.style.display = "none";
											const parent = e.currentTarget.parentElement;
											if (parent) {
												parent.classList.add(
													"rooms-section__card-image-wrapper--placeholder"
												);
												parent.innerHTML = `<div class="rooms-section__card-image-placeholder">${offering.name[0]}</div>`;
											}
										}}
									/>
								)}
								{offering.tag && (
									<span className="rooms-section__card-tag">
										{offering.tag}
									</span>
								)}
							</div>
							<div className="rooms-section__card-content">
								<div className="rooms-section__card-header">
									<h3 className="rooms-section__card-title">{offering.name}</h3>
									<span className="rooms-section__card-price">
										from {formatMoney(offering.basePrice, "USD")}/night
									</span>
								</div>
								<p className="rooms-section__card-description">
									{offering.description}
								</p>
								{offering.features && offering.features.length > 0 && (
									<ul className="rooms-section__card-features">
										{offering.features.map((feature, index) => (
											<li key={index} className="rooms-section__card-feature">
												{feature}
											</li>
										))}
									</ul>
								)}
								{offering.capacity && (
									<div className="rooms-section__card-capacity">
										<span className="rooms-section__capacity-icon">👤</span>
										<span className="rooms-section__capacity-text">
											{offering.capacity}
										</span>
									</div>
								)}
								<button
									className="rooms-section__card-button"
									onClick={handleBookNow}
								>
									Book Now
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default RoomsSection;
