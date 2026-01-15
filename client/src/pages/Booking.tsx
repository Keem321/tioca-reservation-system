import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
	useSearchAvailableRoomsQuery,
	useGetRecommendedRoomsQuery,
	useSearchGroupAvailableRoomsMutation,
} from "../features/roomsApi";
import {
	setIsGroupBooking,
	addTimeslot,
	removeTimeslot,
} from "../features/groupBookingSlice";
import type { RootState } from "../store";
import type { Room } from "../types/room";
import type { GroupMemberRequest } from "../features/groupBookingSlice";
import BookingSearchForm from "../components/booking/BookingSearchForm";
import GroupBookingTimeslot from "../components/booking/GroupBookingTimeslot";
import SearchResults from "../components/booking/SearchResults";
import Navbar from "../components/landing/Navbar";
import PodCard from "../components/booking/PodCard";
import { Plus } from "lucide-react";
import "./Booking.css";

/**
 * Booking Page Component
 *
 * Main booking page with top-level split:
 * - Individual Booking: Single room with floor preference
 * - Group Booking: Multiple timeslots with different check-in/out dates
 */

const Booking: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { checkIn, checkOut, zone } = useSelector(
		(state: RootState) => state.booking
	);
	const { isGroupBooking, timeslots } = useSelector(
		(state: RootState) => state.groupBooking
	);
	const [shouldSearch, setShouldSearch] = useState(false);
	const [groupSearchResults, setGroupSearchResults] = useState<{
		primary: Array<{
			memberId: string;
			roomId: string;
			room: Room;
			floor: string;
			quality: string;
			isProximate: boolean;
		}>;
		recommendations: Array<{
			memberId: string;
			quality: string;
			preferredFloor?: string;
			status: string;
		}>;
	} | null>(null);

	const [searchGroupRooms, { isLoading: isGroupSearching }] =
		useSearchGroupAvailableRoomsMutation();

	const isRelatedFloor = (searchFloor: string, candidate: string) => {
		if (searchFloor === "men-only" || searchFloor === "women-only") {
			return candidate === "business";
		}
		if (searchFloor === "business") {
			return candidate === "men-only" || candidate === "women-only";
		}
		return false;
	};

	const groupRoomsByQuality = (rooms: Room[], keyByFloor = false) => {
		const map = new Map<string, Room[]>();
		rooms.forEach((room) => {
			if (room.status === "maintenance") return;
			const key = keyByFloor ? `${room.floor}-${room.quality}` : room.quality;
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(room);
		});
		return Array.from(map.values()).map((list) => ({
			representative: list[0],
			rooms: list,
		}));
	};

	// Automatically trigger search for individual booking if all required fields are present
	React.useEffect(() => {
		if (!isGroupBooking && checkIn && checkOut && checkIn < checkOut && zone) {
			setShouldSearch(true);
		}
	}, [checkIn, checkOut, zone, isGroupBooking]);

	// Search for available rooms (individual booking)
	const { data: searchResults = [], isLoading: isSearching } =
		useSearchAvailableRoomsQuery(
			{
				checkIn: checkIn || "",
				checkOut: checkOut || "",
				floor: zone || undefined,
			},
			{
				skip: isGroupBooking || !shouldSearch || !checkIn || !checkOut || !zone,
			}
		);

	// Get recommended rooms (individual booking)
	const { data: recommendedResults } = useGetRecommendedRoomsQuery(
		{
			checkIn: checkIn || "",
			checkOut: checkOut || "",
			floor: zone || undefined,
		},
		{
			skip: isGroupBooking || !shouldSearch || !checkIn || !checkOut || !zone,
		}
	);

	const availableGroups = React.useMemo(() => {
		const filtered = searchResults.filter((room) => room.floor === zone);
		return groupRoomsByQuality(filtered);
	}, [searchResults, zone]);

	const recommendedGroups = React.useMemo(() => {
		const recommendedRooms = recommendedResults ?? [];
		const filtered = recommendedRooms.filter(
			(room: Room & { availabilityInfo?: { availablePercent?: number } }) => {
				const availability = room.availabilityInfo?.availablePercent ?? 0;
				if (availability >= 80) return true;
				return zone ? isRelatedFloor(zone, room.floor) : false;
			}
		);
		return groupRoomsByQuality(filtered, true);
	}, [recommendedResults, zone]);

	const handleSearch = () => {
		if (checkIn && checkOut && checkIn < checkOut && zone) {
			setShouldSearch(true);
		}
	};

	const handleFormChange = () => {
		setShouldSearch(false);
	};

	const handleGroupSearch = async (
		checkIn: string,
		checkOut: string,
		members: GroupMemberRequest[],
		proximityByFloor: Record<string, boolean>
	) => {
		console.log("Group search:", {
			checkIn,
			checkOut,
			members,
			proximityByFloor,
		});

		try {
			const result = await searchGroupRooms({
				checkIn,
				checkOut,
				members,
				proximityByFloor,
			}).unwrap();

			console.log("Group search results:", result);
			setGroupSearchResults(result);
		} catch (error: unknown) {
			console.error("Group search error:", error);
			setGroupSearchResults(null);
		}
	};

	const getNights = () => {
		if (!checkIn || !checkOut) return 0;
		const start = new Date(checkIn);
		const end = new Date(checkOut);
		return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
	};

	return (
		<div className="booking-page">
			<Navbar />
			<div className="booking-page__container">
				<div className="booking-page__header">
					<h1 className="booking-page__title">Book Your Stay</h1>
					<p className="booking-page__subtitle">
						Find your perfect capsule in Tokyo
					</p>
				</div>

				{/* Booking Mode Selection */}
				<div className="booking-page__mode-selector">
					<button
						className={`booking-page__mode-btn ${
							!isGroupBooking ? "active" : ""
						}`}
						onClick={() => dispatch(setIsGroupBooking(false))}
					>
						Individual Booking
					</button>
					<button
						className={`booking-page__mode-btn ${
							isGroupBooking ? "active" : ""
						}`}
						onClick={() => dispatch(setIsGroupBooking(true))}
					>
						Group Booking
					</button>
				</div>

				{/* Individual Booking Mode */}
				{!isGroupBooking && (
					<>
						<BookingSearchForm
							onSearch={handleSearch}
							isSearching={isSearching}
							onValuesChange={handleFormChange}
						/>

						{shouldSearch && !isSearching && (
							<>
								<SearchResults
									results={availableGroups}
									nights={getNights()}
									checkIn={checkIn}
									checkOut={checkOut}
								/>

								{recommendedGroups.length > 0 && (
									<div className="booking-page__recommendations">
										<h2 className="booking-page__recommendations-title">
											Recommended Options
										</h2>
										<p className="booking-page__recommendations-subtitle">
											These rooms are partially available or on alternative
											floors
										</p>
										<div className="search-results__grid search-results__grid--recommendations">
											{recommendedGroups.map((group) => {
												const availInfo = (group.representative as any)
													.availabilityInfo;
												let badgeText = "";
												let descriptionText = "";

												if (availInfo) {
													const unavailableDays =
														availInfo.totalDays - availInfo.availableDays;
													const availablePercent = availInfo.availablePercent;

													if (availInfo.isAlternativeFloor) {
														// For alternative floor: badge shows percentage, description shows which floor
														badgeText = `${availablePercent}% available`;
														if (unavailableDays > 0) {
															descriptionText = `${unavailableDays} of ${availInfo.totalDays} days unavailable on alternative ${group.representative.floor} floor`;
														} else {
															descriptionText = `Available on alternative ${group.representative.floor} floor`;
														}
													} else {
														// Same floor but partially available: badge shows days unavailable
														badgeText = `${unavailableDays} of ${availInfo.totalDays} days`;
														descriptionText = `${unavailableDays} of ${availInfo.totalDays} days unavailable`;
													}
												}

												return (
													<div
														key={`${group.representative.floor}-${group.representative.quality}`}
														className="recommended-pod"
													>
														<PodCard
															pod={group.representative}
															assignableRooms={group.rooms}
															nights={getNights()}
															checkIn={checkIn}
															checkOut={checkOut}
															availabilityInfo={availInfo}
															recommendationReason={badgeText}
															availabilityDescription={descriptionText}
														/>
													</div>
												);
											})}
										</div>
									</div>
								)}
							</>
						)}
					</>
				)}

				{/* Group Booking Mode */}
				{isGroupBooking && (
					<div className="booking-page__group-section">
						<div className="booking-page__group-container">
							{timeslots.map((timeslot, index) => (
								<GroupBookingTimeslot
									key={timeslot.id}
									timeslotId={timeslot.id}
									checkIn={timeslot.checkIn}
									checkOut={timeslot.checkOut}
									members={timeslot.members}
									onStartSearch={handleGroupSearch}
									onRemoveTimeslot={(id) => dispatch(removeTimeslot(id))}
									isFirstTimeslot={index === 0}
								/>
							))}

							<button
								className="booking-page__add-period-btn"
								onClick={() => dispatch(addTimeslot())}
							>
								<Plus size={20} />
								Add Another Check-In Period
							</button>
						</div>

						{/* Group Search Results */}
						{isGroupSearching && (
							<div className="booking-page__group-results">
								<div className="booking-page__loading">
									Searching for available rooms...
								</div>
							</div>
						)}

						{!isGroupSearching && groupSearchResults && (
							<div className="booking-page__group-results">
								<h2 className="booking-page__results-title">
									Group Booking Results
								</h2>

								{groupSearchResults.primary.length > 0 && (
									<div className="group-results__primary">
										<h3 className="group-results__section-title">
											✅ Available Rooms ({groupSearchResults.primary.length})
										</h3>
										<div className="group-results__list">
											{groupSearchResults.primary.map((assignment) => (
												<div
													key={assignment.memberId}
													className="group-results__item"
												>
													<div className="group-results__room-info">
														<div className="group-results__room-name">
															{assignment.room.podId}
														</div>
														<div className="group-results__room-details">
															<span className="group-results__quality">
																{assignment.quality}
															</span>
															<span className="group-results__separator">
																•
															</span>
															<span className="group-results__floor">
																{assignment.floor}
															</span>
															{assignment.isProximate && (
																<>
																	<span className="group-results__separator">
																		•
																	</span>
																	<span className="group-results__proximity">
																		🔗 Adjacent
																	</span>
																</>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{groupSearchResults.recommendations.length > 0 && (
									<div className="group-results__recommendations">
										<h3 className="group-results__section-title">
											⚠️ Unavailable Requests (
											{groupSearchResults.recommendations.length})
										</h3>
										<div className="group-results__list">
											{groupSearchResults.recommendations.map((rec, idx) => (
												<div key={idx} className="group-results__item">
													<div className="group-results__room-info">
														<div className="group-results__room-name">
															No availability
														</div>
														<div className="group-results__room-details">
															<span className="group-results__quality">
																{rec.quality}
															</span>
															{rec.preferredFloor && (
																<>
																	<span className="group-results__separator">
																		•
																	</span>
																	<span className="group-results__floor">
																		{rec.preferredFloor}
																	</span>
																</>
															)}
															<span className="group-results__separator">
																•
															</span>
															<span className="group-results__status">
																{rec.status}
															</span>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{groupSearchResults.primary.length ===
									timeslots[0]?.members.length && (
									<div className="group-results__actions">
										<button
											className="group-results__book-btn"
											onClick={() =>
												navigate("/booking/confirm", {
													state: {
														isGroupBooking: true,
														groupResults: groupSearchResults,
														timeslots: timeslots,
													},
												})
											}
										>
											Continue with Group Booking
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Booking;
