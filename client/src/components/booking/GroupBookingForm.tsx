import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import GroupBookingTimeslot from "./GroupBookingTimeslot";
import "./GroupBookingForm.css";

/**
 * GroupBookingForm Component
 *
 * Wrapper component for group booking with timeslots.
 * Uses GroupBookingTimeslot component for each timeslot configuration.
 */
const GroupBookingForm: React.FC = () => {
	const { isGroupBooking, timeslots } = useSelector(
		(state: RootState) => state.groupBooking
	);

	if (!isGroupBooking) {
		return null;
	}

	return (
		<div className="group-booking-form">
			<div className="group-booking-form__header">
				<h3 className="group-booking-form__title">Group Booking</h3>
				<p className="group-booking-form__subtitle">
					Configure timeslots and room preferences for your group
				</p>
			</div>

			{/* Render each timeslot */}
			{timeslots.map((timeslot) => (
				<GroupBookingTimeslot key={timeslot.id} timeslotId={timeslot.id} />
			))}

			<div className="group-booking-form__info">
				<p>
					<strong>
						{timeslots.length} timeslot{timeslots.length !== 1 ? "s" : ""}
					</strong>
					{
						" configured. Each timeslot can have multiple members with different check-in dates."
					}
				</p>
			</div>
		</div>
	);
};

export default GroupBookingForm;
