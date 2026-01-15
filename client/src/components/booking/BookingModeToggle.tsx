import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setIsGroupBooking } from "../../features/groupBookingSlice";
import type { RootState } from "../../store";
import "./BookingModeToggle.css";

/**
 * BookingModeToggle Component
 *
 * Allows users to toggle between individual and group booking modes.
 */
const BookingModeToggle: React.FC = () => {
	const dispatch = useDispatch();
	const { isGroupBooking } = useSelector(
		(state: RootState) => state.groupBooking
	);

	const handleToggle = (mode: "individual" | "group") => {
		const shouldBeGroup = mode === "group";
		dispatch(setIsGroupBooking(shouldBeGroup));
		// setIsGroupBooking handles initialization of first timeslot automatically
	};

	return (
		<div className="booking-mode-toggle">
			<button
				onClick={() => handleToggle("individual")}
				className={`booking-mode-toggle__btn ${
					!isGroupBooking ? "booking-mode-toggle__btn--active" : ""
				}`}
			>
				Individual Booking
			</button>
			<button
				onClick={() => handleToggle("group")}
				className={`booking-mode-toggle__btn ${
					isGroupBooking ? "booking-mode-toggle__btn--active" : ""
				}`}
			>
				Group Booking
			</button>
		</div>
	);
};

export default BookingModeToggle;
