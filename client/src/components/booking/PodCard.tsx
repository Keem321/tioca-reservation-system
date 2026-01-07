import React from "react";
import { useNavigate } from "react-router-dom";
import type { Room } from "../../types/room";
import "./PodCard.css";

/**
 * PodCard Component
 *
 * Displays a single pod/room card with details, pricing, and booking button.
 */

interface PodCardProps {
	pod: Room;
	nights: number;
	checkIn: string;
	checkOut: string;
}

const PodCard: React.FC<PodCardProps> = ({ pod, nights, checkIn, checkOut }) => {
	const navigate = useNavigate();

	const getQualityLabel = (quality: string) => {
		const labels: Record<string, string> = {
			classic: "Classic Pearl",
			milk: "Milk Pearl",
			golden: "Golden Pearl",
			crystal: "Crystal Boba Suite",
			matcha: "Matcha Pearl",
		};
		return labels[quality] || quality;
	};

	const getQualityDescription = (quality: string) => {
		const descs: Record<string, string> = {
			classic: "Essential comfort",
			milk: "Enhanced space",
			golden: "Premium experience",
			crystal: "First-class luxury",
			matcha: "Women-only exclusive",
		};
		return descs[quality] || "";
	};

	const getDimensions = (quality: string, floor: string) => {
		const dims: Record<string, string> = {
			classic: '80" × 40" × 40"',
			milk: '84" × 42" × 45"',
			golden: '86" × 45" × 50"',
			crystal: '90" × 55" × 65"',
			matcha: '86" × 45" × 50"',
		};

		let dimension = dims[quality] || dims.classic;

		if (floor === "couples") {
			dimension = dimension.replace(/× \d+"/, '× 60"');
		}

		return dimension;
	};

	const totalPrice = pod.pricePerNight * nights;
	const displayLabel =
		pod.floor === "couples" ? `Twin ${getQualityLabel(pod.quality)}` : getQualityLabel(pod.quality);

	const handleBookNow = () => {
		// TODO: Navigate to booking confirmation page or show booking modal
		// For now, store booking data in sessionStorage and show alert
		const bookingData = {
			roomId: pod._id,
			hotelId: typeof pod.hotelId === "string" ? pod.hotelId : pod.hotelId._id,
			checkIn,
			checkOut,
			nights,
			totalPrice,
			pricePerNight: pod.pricePerNight,
			roomDetails: {
				podId: pod.podId,
				quality: pod.quality,
				floor: pod.floor,
			},
		};
		sessionStorage.setItem("pendingBooking", JSON.stringify(bookingData));
		alert(
			`Selected: ${displayLabel}\n${nights} night(s) - $${totalPrice}\n\nGuest information form coming soon!`
		);
		// Future: navigate("/booking/confirm", { state: bookingData });
	};

	return (
		<div className="pod-card">
			{/* Image Placeholder */}
			<div className="pod-card__image">
				{displayLabel[0]}
			</div>

			{/* Content */}
			<div className="pod-card__content">
				<h3 className="pod-card__title">{displayLabel}</h3>
				<p className="pod-card__description">
					{getQualityDescription(pod.quality)} • {getDimensions(pod.quality, pod.floor)}
				</p>
				<div className="pod-card__availability">
					<span className="pod-card__availability-dot"></span>
					<span className="pod-card__availability-text">
						{pod.status === "available" ? "Available" : "Limited availability"}
					</span>
				</div>
			</div>

			{/* Price & CTA */}
			<div className="pod-card__pricing">
				<div className="pod-card__price-info">
					<div className="pod-card__price">${pod.pricePerNight}</div>
					<div className="pod-card__price-label">per night</div>
					{nights > 1 && (
						<div className="pod-card__total-price">
							${totalPrice} total
						</div>
					)}
				</div>
				<button
					onClick={handleBookNow}
					className="pod-card__button"
				>
					Book Now
				</button>
			</div>
		</div>
	);
};

export default PodCard;

