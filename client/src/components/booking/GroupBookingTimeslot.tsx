import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { Check, X, Plus } from "lucide-react";
import {
	addMemberToTimeslot,
	removeMemberFromTimeslot,
	updateMemberInTimeslot,
	setTimeslotCheckIn,
	setTimeslotCheckOut,
} from "../../features/groupBookingSlice";
import { useDispatch, useSelector } from "react-redux";
import type { GroupMemberRequest } from "../../features/groupBookingSlice";
import type { PodFloor, PodQuality } from "../../types/room";
import type { RootState } from "../../store";
import "./GroupBookingTimeslot.css";

interface GroupBookingTimeslotProps {
	timeslotId: string;
	checkIn?: string;
	checkOut?: string;
	members?: GroupMemberRequest[];
	onStartSearch?: (
		checkIn: string,
		checkOut: string,
		members: GroupMemberRequest[],
		proximityByFloor: Record<string, boolean>
	) => void;
	onRemoveTimeslot?: (timeslotId: string) => void;
	isFirstTimeslot?: boolean;
}

const GroupBookingTimeslot: React.FC<GroupBookingTimeslotProps> = ({
	timeslotId,
	checkIn: propsCheckIn,
	checkOut: propsCheckOut,
	members: propsMembers,
	onStartSearch,
	onRemoveTimeslot,
	isFirstTimeslot: propsIsFirstTimeslot,
}) => {
	const dispatch = useDispatch();

	// Get timeslot data from Redux if not provided as props
	const timeslotFromRedux = useSelector((state: RootState) =>
		state.groupBooking.timeslots.find((ts) => ts.id === timeslotId)
	);
	const timeslotsCount = useSelector(
		(state: RootState) => state.groupBooking.timeslots.length
	);

	// Use props if provided, otherwise use Redux data
	const savedCheckIn = propsCheckIn ?? timeslotFromRedux?.checkIn ?? "";
	const savedCheckOut = propsCheckOut ?? timeslotFromRedux?.checkOut ?? "";
	const members = propsMembers ?? timeslotFromRedux?.members ?? [];
	const isFirstTimeslot =
		propsIsFirstTimeslot ??
		(timeslotsCount > 0 && timeslotFromRedux?.id === timeslotFromRedux?.id);
	const [checkIn, setCheckIn] = useState<Date | null | undefined>(() => {
		const date =
			savedCheckIn && savedCheckIn !== "" ? new Date(savedCheckIn) : null;
		return date;
	});
	const [checkOut, setCheckOut] = useState<Date | null | undefined>(() => {
		const date =
			savedCheckOut && savedCheckOut !== "" ? new Date(savedCheckOut) : null;
		return date;
	});
	const [selectedFloors, setSelectedFloors] = useState<Set<PodFloor>>(() => {
		// Initialize selected floors from existing members
		const existingFloors = new Set(
			members.map((m) => m.floor).filter(Boolean) as PodFloor[]
		);
		return existingFloors;
	});
	const [step, setStep] = useState<"dates" | "floors">(() => {
		// If dates are already saved, start on floors step
		return savedCheckIn && savedCheckOut ? "floors" : "dates";
	});

	const podFloors: PodFloor[] = [
		"women-only",
		"men-only",
		"couples",
		"business",
	];

	// Get available room qualities for a specific floor
	const getQualitiesForFloor = (floor: PodFloor): PodQuality[] => {
		switch (floor) {
			case "women-only":
				return ["classic", "milk", "golden", "matcha"];
			case "men-only":
				return ["classic", "milk", "golden"];
			case "couples":
				return ["classic", "milk", "golden"];
			case "business":
				return ["classic", "milk", "golden", "crystal"];
			default:
				return ["classic", "milk", "golden"];
		}
	};

	// Get members by floor
	const getMembersForFloor = (floor: PodFloor) => {
		return members.filter((m) => m.floor === floor);
	};

	// Handle date selection and move to floor selection
	const handleDatesNext = () => {
		if (checkIn && checkOut && checkIn < checkOut) {
			// Save dates to Redux
			dispatch(
				setTimeslotCheckIn({
					timeslotId,
					checkIn: checkIn.toISOString(),
				})
			);
			dispatch(
				setTimeslotCheckOut({
					timeslotId,
					checkOut: checkOut.toISOString(),
				})
			);
			// Initialize selected floors from existing members
			const existingFloors = new Set(
				members.map((m) => m.floor).filter(Boolean) as PodFloor[]
			);
			setSelectedFloors(existingFloors);
			setStep("floors");
		}
	};

	// Handle floor selection toggle
	const handleFloorToggle = (floor: PodFloor) => {
		const newSelectedFloors = new Set(selectedFloors);
		if (newSelectedFloors.has(floor)) {
			// Remove floor - delete all members on this floor
			newSelectedFloors.delete(floor);
			const membersOnFloor = members.filter((m) => m.floor === floor);
			membersOnFloor.forEach((member) => {
				dispatch(
					removeMemberFromTimeslot({
						timeslotId,
						memberId: member.id,
					})
				);
			});
		} else {
			// Add floor - create first member for this floor if needed
			newSelectedFloors.add(floor);
			const hasMembers = members.some((m) => m.floor === floor);
			if (!hasMembers) {
				dispatch(
					addMemberToTimeslot({
						timeslotId,
						quality: "",
						floor,
					})
				);
			}
		}
		setSelectedFloors(newSelectedFloors);
	};

	// Add member to specific floor
	const handleAddMemberToFloor = (floor: PodFloor) => {
		dispatch(
			addMemberToTimeslot({
				timeslotId,
				quality: "",
				floor,
			})
		);
	};

	// Toggle proximity for members on a floor
	const [proximityByFloor, setProximityByFloor] = useState<
		Map<PodFloor, boolean>
	>(new Map());

	const toggleProximity = (floor: PodFloor) => {
		const newProximity = new Map(proximityByFloor);
		newProximity.set(floor, !newProximity.get(floor));
		setProximityByFloor(newProximity);
	};

	const canSearch =
		checkIn &&
		checkOut &&
		checkIn < checkOut &&
		selectedFloors.size > 0 &&
		members.length > 0 &&
		members.every((m) => m.quality !== "" && m.floor); // All members must have quality and floor

	const handleSearch = () => {
		if (canSearch && onStartSearch) {
			// Convert Map to object for API
			const proximityObj: Record<string, boolean> = {};
			proximityByFloor.forEach((value, key) => {
				proximityObj[key] = value;
			});

			onStartSearch(
				checkIn!.toISOString().split("T")[0],
				checkOut!.toISOString().split("T")[0],
				members,
				proximityObj
			);
		}
	};

	const getDisplayFloorLabel = (floor: PodFloor) => {
		return floor
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	return (
		<div className="group-booking-timeslot">
			<div className="group-booking-timeslot__header">
				<h3 className="group-booking-timeslot__title">
					{isFirstTimeslot ? "Group Booking" : `Additional Period`}
				</h3>
				{!isFirstTimeslot && onRemoveTimeslot && (
					<button
						className="group-booking-timeslot__remove-btn"
						onClick={() => onRemoveTimeslot(timeslotId)}
						aria-label="Remove this timeslot"
					>
						<X size={20} />
					</button>
				)}
			</div>

			{/* STEP 1: Date Selection */}
			{step === "dates" && (
				<div className="group-booking-timeslot__step">
					<h4 className="group-booking-timeslot__step-title">
						Step 1: Select Dates
					</h4>
					<div className="group-booking-timeslot__dates">
						<div className="group-booking-timeslot__date-group">
							<label className="group-booking-timeslot__label">
								Check-in Date
							</label>
							<DatePicker
								selected={checkIn}
								onChange={(date: Date | null) => setCheckIn(date)}
								minDate={new Date()}
								placeholderText="Select check-in"
								className="group-booking-timeslot__input"
							/>
						</div>
						<div className="group-booking-timeslot__date-group">
							<label className="group-booking-timeslot__label">
								Check-out Date
							</label>
							<DatePicker
								selected={checkOut}
								onChange={(date: Date | null) => setCheckOut(date)}
								minDate={checkIn || new Date()}
								placeholderText="Select check-out"
								className="group-booking-timeslot__input"
							/>
						</div>
					</div>
					<button
						className={`group-booking-timeslot__next-btn ${
							!checkIn || !checkOut || checkIn >= checkOut ? "disabled" : ""
						}`}
						onClick={handleDatesNext}
						disabled={!checkIn || !checkOut || checkIn >= checkOut}
					>
						Next: Select Floors
					</button>
				</div>
			)}

			{/* STEP 2: Floor Selection & Guest Configuration */}
			{step === "floors" && (
				<div className="group-booking-timeslot__step">
					<h4 className="group-booking-timeslot__step-title">
						Step 2: Select Floors & Configure Guests
					</h4>
					<p className="group-booking-timeslot__step-subtitle">
						Choose floors and configure room quality for each guest.
					</p>

					<div className="group-booking-timeslot__floor-sections">
						{podFloors.map((floor) => {
							const isSelected = selectedFloors.has(floor);
							const floorMembers = getMembersForFloor(floor);
							const guestCount = floorMembers.length;
							const hasProximity = proximityByFloor.get(floor) || false;

							return (
								<div
									key={floor}
									className={`group-booking-timeslot__floor-section ${
										isSelected ? "selected" : ""
									}`}
								>
									<div className="group-booking-timeslot__floor-header">
										<button
											className={`group-booking-timeslot__floor-toggle ${
												isSelected ? "selected" : ""
											}`}
											onClick={() => handleFloorToggle(floor)}
										>
											<span className="group-booking-timeslot__floor-name">
												{getDisplayFloorLabel(floor)}
											</span>
											{isSelected && (
												<span className="group-booking-timeslot__floor-badge">
													{guestCount} {guestCount === 1 ? "guest" : "guests"}
												</span>
											)}
										</button>
									</div>

									{isSelected && (
										<div className="group-booking-timeslot__floor-content">
											{/* Proximity toggle if multiple guests */}
											{guestCount > 1 && (
												<label className="group-booking-timeslot__proximity-checkbox">
													<input
														type="checkbox"
														checked={hasProximity}
														onChange={() => toggleProximity(floor)}
													/>
													<span>Ensure proximity (rooms near each other)</span>
												</label>
											)}

											{/* Guest list for this floor */}
											<div className="group-booking-timeslot__floor-members">
												{floorMembers.map((member, index) => (
													<div
														key={member.id}
														className="group-booking-timeslot__member-card"
													>
														<div className="group-booking-timeslot__member-header">
															<span className="group-booking-timeslot__member-number">
																Guest {index + 1}
															</span>
														</div>

														<div className="group-booking-timeslot__field">
															<label className="group-booking-timeslot__field-label">
																Room Quality
															</label>
															<select
																value={member.quality}
																onChange={(e) =>
																	dispatch(
																		updateMemberInTimeslot({
																			timeslotId,
																			memberId: member.id,
																			quality: e.target.value as PodQuality,
																		})
																	)
																}
																className="group-booking-timeslot__field-select"
															>
																<option value="">Select quality...</option>
																{getQualitiesForFloor(floor).map((q) => (
																	<option key={q} value={q}>
																		{q.charAt(0).toUpperCase() + q.slice(1)}
																	</option>
																))}
															</select>
														</div>

														{/* Guest Count for Couples or Business-Crystal */}
														{(floor === "couples" ||
															(floor === "business" &&
																member.quality === "crystal")) && (
															<div className="group-booking-timeslot__field">
																<label className="group-booking-timeslot__field-label">
																	Number of Guests
																</label>
																<select
																	value={member.numberOfGuests || 1}
																	onChange={(e) =>
																		dispatch(
																			updateMemberInTimeslot({
																				timeslotId,
																				memberId: member.id,
																				numberOfGuests: parseInt(
																					e.target.value,
																					10
																				),
																			})
																		)
																	}
																	className="group-booking-timeslot__field-select"
																>
																	<option value="1">1 Guest</option>
																	<option value="2">2 Guests</option>
																</select>
															</div>
														)}

														{floorMembers.length > 1 && (
															<button
																className="group-booking-timeslot__remove-member-btn"
																onClick={() => {
																	dispatch(
																		removeMemberFromTimeslot({
																			timeslotId,
																			memberId: member.id,
																		})
																	);
																}}
																aria-label="Remove member"
															>
																<X size={18} /> Remove
															</button>
														)}
													</div>
												))}
											</div>

											{/* Add guest button for this floor */}
											<button
												className="group-booking-timeslot__add-floor-member-btn"
												onClick={() => handleAddMemberToFloor(floor)}
											>
												<Plus size={18} />
												Add Guest to {getDisplayFloorLabel(floor)}
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>

					<div className="group-booking-timeslot__step-actions">
						<button
							className="group-booking-timeslot__back-btn"
							onClick={() => setStep("dates")}
						>
							Back
						</button>
						{onStartSearch && (
							<button
								className={`group-booking-timeslot__search-btn ${
									!canSearch ? "disabled" : ""
								}`}
								onClick={handleSearch}
								disabled={!canSearch}
							>
								<Check size={20} />
								Search Availability
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default GroupBookingTimeslot;
