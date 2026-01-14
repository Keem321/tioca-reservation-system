import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetRoomOfferingsQuery } from "../../features/offeringsApi";
import { formatMoney } from "../../utils/money";
import type { Offering } from "../../types/offering";
import "./RoomsSection.css";

/**
 * RoomsSection Component
 *
 * Displays capsule type showcase for advertising purposes.
 * All data (name, description, features, pricing, images) is fetched dynamically from the offerings API.
 * Updates to offerings in the database automatically reflect here.
 * Twin rooms are displayed as a single concise upgrade card in the main grid.
 */
const RoomsSection: React.FC = () => {
	const navigate = useNavigate();
	const { data: roomOfferings = [] } = useGetRoomOfferingsQuery({
		activeOnly: true,
	});

	const handleBookNow = () => {
		navigate("/booking");
	};

	// Organize offerings by variant - separate single and twin offerings
	const { singleRooms, twinRooms, twinMap } = useMemo(() => {
		const singles: Offering[] = [];
		const twins: Offering[] = [];
		const twinMapping: Record<string, Offering> = {};

		roomOfferings.forEach((offering) => {
			if (offering.variant === "twin") {
				twins.push(offering);
				twinMapping[offering.quality] = offering;
			} else {
				// Include single rooms (those without variant or explicitly marked as single)
				if (
					!offering.applicableFloors ||
					!offering.applicableFloors.includes("couples")
				) {
					singles.push(offering);
				}
			}
		});

		return {
			singleRooms: singles,
			twinRooms: twins,
			twinMap: twinMapping,
		};
	}, [roomOfferings]);

	// Calculate min and max twin price differences for the upgrade card
	const twinUpgradePrices = useMemo(() => {
		return twinRooms
			.map((twin) => {
				const single = singleRooms.find((s) => s.quality === twin.quality);
				return single ? twin.basePrice - single.basePrice : 0;
			})
			.filter((price) => price > 0);
	}, [twinRooms, singleRooms]);

	return (
		<section id="rooms" className="rooms-section">
			<div className="rooms-section__container">
				<h2 className="rooms-section__title">Our Capsules</h2>
				<p className="rooms-section__subtitle">
					Choose from our range of thoughtfully designed capsule accommodations
				</p>

				<div className="rooms-section__grid">
					{singleRooms.map((offering) => {
						const hasTwinVariant =
							offering.quality && twinMap[offering.quality];
						const twinPriceDifference =
							hasTwinVariant && offering.quality
								? twinMap[offering.quality].basePrice - offering.basePrice
								: 0;

						return (
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
									{hasTwinVariant && (
										<span className="rooms-section__card-tag rooms-section__card-tag--twin">
											Twin Available
										</span>
									)}
								</div>
								<div className="rooms-section__card-content">
									<div className="rooms-section__card-header">
										<h3 className="rooms-section__card-title">
											{offering.name}
										</h3>
										<span className="rooms-section__card-price">
											from {formatMoney(offering.basePrice, "USD")}
											/night
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
									{hasTwinVariant && twinPriceDifference > 0 && (
										<div className="rooms-section__card-upgrade-info">
											<span className="rooms-section__upgrade-text">
												Twin upgrade: +{formatMoney(twinPriceDifference, "USD")}
												/night
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
						);
					})}

					{/* Twin Rooms Upgrade Card */}
					{twinRooms.length > 0 && twinUpgradePrices.length > 0 && (
						<div className="rooms-section__card rooms-section__card--twin-upgrade">
							<div className="rooms-section__card-image-wrapper rooms-section__card-image-wrapper--twin-upgrade">
								<img
									src="/images/capsules/twin-pearl.jpg"
									alt="Twin Rooms"
									className="rooms-section__card-image"
									onError={(e) => {
										// Fallback if image doesn't exist
										e.currentTarget.style.display = "none";
										const parent = e.currentTarget.parentElement;
										if (parent) {
											parent.classList.add(
												"rooms-section__card-image-wrapper--placeholder"
											);
											parent.innerHTML = `<div class="rooms-section__card-image-placeholder">👥</div>`;
										}
									}}
								/>
								<span className="rooms-section__card-tag rooms-section__card-tag--highlight">
									Twin Upgrade
								</span>
							</div>
							<div className="rooms-section__card-content">
								<div className="rooms-section__card-header">
									<h3 className="rooms-section__card-title">Twin Rooms</h3>
									<span className="rooms-section__card-price">
										+{formatMoney(Math.min(...twinUpgradePrices), "USD")}-
										{formatMoney(Math.max(...twinUpgradePrices), "USD")}/night
									</span>
								</div>
								<p className="rooms-section__card-description">
									Perfect for couples and friends who want extra space and
									comfort
								</p>
								<div className="rooms-section__twin-upgrade-features">
									<div className="rooms-section__twin-feature">
										<span className="rooms-section__twin-feature-icon">✓</span>
										<span className="rooms-section__twin-feature-text">
											2x space
										</span>
									</div>
									<div className="rooms-section__twin-feature">
										<span className="rooms-section__twin-feature-icon">✓</span>
										<span className="rooms-section__twin-feature-text">
											Enhanced comfort
										</span>
									</div>
								</div>
								<div className="rooms-section__twin-variant-list">
									{twinRooms.map((twin) => (
										<div key={twin._id} className="rooms-section__twin-variant">
											<span className="rooms-section__variant-name">
												{twin.name}
											</span>
											<span className="rooms-section__variant-price">
												{formatMoney(twin.basePrice, "USD")}/night
											</span>
										</div>
									))}
								</div>
								<button
									className="rooms-section__card-button rooms-section__card-button--twin"
									onClick={handleBookNow}
								>
									Book Now
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default RoomsSection;
