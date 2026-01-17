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
import { useFormatMoney } from "../../hooks";
import "./PodCard.css";

/**
 * PodCard Component
 *
 * Displays a single pod/room card with details, pricing, and booking button.
 * Now includes standardized room images that match the landing page.
 */

interface PodCardProps {
	pod: Room; // representative room for display
	assignableRooms?: Room[]; // pool of rooms to auto-assign
	nights: number;
	checkIn: string;
	checkOut: string;
	availabilityInfo?: {
		availableDays: number;
		totalDays: number;
		availablePercent: number;
		isAlternativeFloor: boolean;
	};
	recommendationReason?: string;
	availabilityDescription?: string;
}

const PodCard: React.FC<PodCardProps> = ({
	pod,
	assignableRooms,
	nights,
	checkIn,
	checkOut,
	recommendationReason,
	availabilityDescription,
}) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { formatMoney } = useFormatMoney();

	// Get price from offering (in cents)
	const assignablePool = assignableRooms?.length ? assignableRooms : [pod];
	const chosenRoom = assignablePool[0];
	const pricePerNight = chosenRoom.offering?.basePrice || 0;
	const totalPrice = pricePerNight * nights;
	const displayLabel = getRoomDisplayLabel(pod.quality, pod.floor);
	const roomImage = getRoomImage(pod.quality, pod.floor);
	const description = getRoomQualityDescription(pod.quality);
	const dimensions = getRoomDimensions(pod.quality, pod.floor);

	const handleBookNow = () => {
		// Auto-assign the first available room in the pool
		const assigned = assignablePool[0];
		dispatch(setSelectedRoom(assigned));
		navigate("/booking/confirm", {
			state: {
				room: assigned,
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
					<div className="pod-card__header">
						<h3 className="pod-card__title">{displayLabel}</h3>
						{recommendationReason && (
							<span className="pod-card__recommendation-badge">
								{recommendationReason}
							</span>
						)}
					</div>
					<p className="pod-card__room-number">
						{assignablePool.length > 1
							? `${assignablePool.length} rooms available`
							: `Room ${chosenRoom.podId || "assigned on booking"}`}
					</p>
					{availabilityDescription && (
						<p className="pod-card__availability-info">
							{availabilityDescription}
						</p>
					)}
					<p className="pod-card__description">
						{description} • {dimensions}
					</p>
				</div>
			</div>
			<div className="pod-card__pricing">
				<div className="pod-card__price-info">
					<div className="pod-card__price">{formatMoney(pricePerNight)}</div>
					<div className="pod-card__price-label">per night</div>
					{nights > 1 && (
						<div className="pod-card__total-price">
							{formatMoney(totalPrice)} total
						</div>
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
