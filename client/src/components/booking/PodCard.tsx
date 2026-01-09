import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setSelectedRoom } from "../../features/bookingSlice";
import type { Room } from "../../types/room";
import {
	getRoomImage,
	getRoomDisplayLabel,
	getRoomQualityDescription,
	getRoomDimensions,
} from "../../utils/roomImages";
import "./PodCard.css";

/**
 * PodCard Component
 *
 * Displays a single pod/room card with details, pricing, and booking button.
 * Now includes standardized room images that match the landing page.
 */

interface PodCardProps {
	pod: Room;
	nights: number;
	checkIn: string;
	checkOut: string;
}

const PodCard: React.FC<PodCardProps> = ({
	pod,
	nights,
	checkIn,
	checkOut,
}) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const totalPrice = pod.pricePerNight * nights;
	const displayLabel = getRoomDisplayLabel(pod.quality, pod.floor);
	const roomImage = getRoomImage(pod.quality, pod.floor);
	const description = getRoomQualityDescription(pod.quality);
	const dimensions = getRoomDimensions(pod.quality, pod.floor);

	const handleBookNow = () => {
		// Store selected room in Redux for booking confirmation
		dispatch(setSelectedRoom(pod));
		// Navigate to booking confirmation page
		navigate("/booking/confirm", {
			state: {
				room: pod,
				checkIn,
				checkOut,
				nights,
				totalPrice,
			},
		});
	};

	return (
		<div className="pod-card">
			<div className="pod-card__left">
				<div className="pod-card__image">
					<img
						src={roomImage}
						alt={displayLabel}
						onError={(e) => {
							// Fallback to placeholder if image fails to load
							e.currentTarget.style.display = "none";
							const parent = e.currentTarget.parentElement;
							if (parent) {
								parent.innerHTML = `<div class="pod-card__image-placeholder">${displayLabel[0]}</div>`;
							}
						}}
					/>
				</div>
				<div className="pod-card__content">
					<h3 className="pod-card__title">{displayLabel}</h3>
					<p className="pod-card__room-number">Room {pod.podId}</p>
					<p className="pod-card__description">
						{description} • {dimensions}
					</p>
				</div>
			</div>
			<div className="pod-card__pricing">
				<div className="pod-card__price-info">
					<div className="pod-card__price">${pod.pricePerNight}</div>
					<div className="pod-card__price-label">per night</div>
					{nights > 1 && (
						<div className="pod-card__total-price">${totalPrice} total</div>
					)}
				</div>
				<button onClick={handleBookNow} className="pod-card__button">
					Book Now
				</button>
			</div>
		</div>
	);
};

export default PodCard;
