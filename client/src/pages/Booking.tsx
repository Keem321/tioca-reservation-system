import React, { useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Calendar, Users, ChevronRight } from "lucide-react";
import Navbar from "../components/landing/Navbar";
import { setCheckIn, setCheckOut, setGuests } from "../features/bookingSlice";
import { useGetRoomsQuery } from "../features/roomsApi";
import { useGetReservationsQuery } from "../features/reservationsApi";
import type { RootState, AppDispatch } from "../store";
import type { Room, PodFloor } from "../types/room";
import "./Booking.css";

/**
 * Booking Page Component
 *
 * Comprehensive booking flow where guests:
 * - Select check-in/check-out dates
 * - Choose floor/zone preference
 * - See available rooms matching criteria
 * - See "close match" suggestions (alt floors, partial availability)
 */
const Booking: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();

	// Get booking state from Redux
	const { checkIn, checkOut, guests } = useSelector(
		(state: RootState) => state.booking
	);

	// Local state for filters
	const [selectedFloor, setSelectedFloor] = useState<PodFloor | "">("");

	// Fetch rooms and reservations
	const { data: rooms = [] } = useGetRoomsQuery(undefined);
	const { data: reservations = [] } = useGetReservationsQuery();

	// Helper: check if room is booked during a window
	const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
		return aStart < bEnd && aEnd > bStart;
	};

	// Parse dates
	const checkInDate = useMemo(() => new Date(checkIn), [checkIn]);
	const checkOutDate = useMemo(() => new Date(checkOut), [checkOut]);

	// Compute booked roomIds for the date range
	const bookedRoomIds = useMemo(() => {
		return new Set(
			reservations
				.filter(
					(r) =>
						["pending", "confirmed", "checked-in"].includes(r.status) &&
						overlaps(
							new Date(r.checkInDate),
							new Date(r.checkOutDate),
							checkInDate,
							checkOutDate
						)
				)
				.map((r) => (typeof r.roomId === "string" ? r.roomId : r.roomId._id))
		);
	}, [reservations, checkInDate, checkOutDate]);

	// Helper: compute partial availability (available on some days)
	const getAvailableDays = useCallback(
		(roomId: string): number => {
			const range = Math.ceil(
				(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			let availableDays = range;
			for (const res of reservations) {
				if (
					(typeof res.roomId === "string"
						? res.roomId === roomId
						: res.roomId._id === roomId) &&
					["pending", "confirmed", "checked-in"].includes(res.status)
				) {
					const resStart = new Date(res.checkInDate);
					const resEnd = new Date(res.checkOutDate);
					if (overlaps(resStart, resEnd, checkInDate, checkOutDate)) {
						const overlapStart = Math.max(
							resStart.getTime(),
							checkInDate.getTime()
						);
						const overlapEnd = Math.min(
							resEnd.getTime(),
							checkOutDate.getTime()
						);
						const overlapDays = Math.ceil(
							(overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)
						);
						availableDays -= overlapDays;
					}
				}
			}
			return Math.max(0, availableDays);
		},
		[reservations, checkInDate, checkOutDate]
	);

	// Main available rooms: selected floor, fully available
	const mainAvailable = useMemo(() => {
		if (!selectedFloor) return [];
		const isCouple = selectedFloor === "couples";
		const maxGuests = isCouple ? 2 : 1;
		if (guests > maxGuests) return [];

		return rooms.filter((r) => {
			if (r.floor !== selectedFloor) return false;
			if (r.status === "maintenance") return false;
			if (bookedRoomIds.has(r._id)) return false;
			return true;
		});
	}, [rooms, selectedFloor, guests, bookedRoomIds]);

	// Close matches: alternative suggestions (max 5)
	const closeMatches = useMemo(() => {
		if (!selectedFloor) return [];
		const isCouple = selectedFloor === "couples";
		const range = Math.ceil(
			(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Get alternative floors to suggest
		const altFloors: PodFloor[] = [];
		if (selectedFloor === "women-only") {
			altFloors.push("business");
		} else if (selectedFloor === "men-only") {
			altFloors.push("business");
		}
		// If couples, no suggestion; if business, no suggestion

		// Collect candidates
		const candidates: Array<{ room: Room; reason: string }> = [];

		// 1. Rooms from alternative floors (fully available)
		for (const floor of altFloors) {
			const maxGuestsAlt = floor === "couples" ? 2 : 1;
			if (guests <= maxGuestsAlt) {
				for (const r of rooms) {
					if (
						r.floor === floor &&
						r.status !== "maintenance" &&
						!bookedRoomIds.has(r._id)
					) {
						candidates.push({
							room: r,
							reason: `Available on ${floor} floor`,
						});
					}
				}
			}
		}

		// 2. Rooms from selected floor, partially available (≥80% of days)
		const maxGuests = isCouple ? 2 : 1;
		if (guests <= maxGuests) {
			for (const r of rooms) {
				if (r.floor === selectedFloor && r.status !== "maintenance") {
					if (bookedRoomIds.has(r._id)) {
						const availDays = getAvailableDays(r._id);
						const pct = (availDays / range) * 100;
						if (pct >= 80) {
							candidates.push({
								room: r,
								reason: `Available ${Math.round(pct)}% of dates`,
							});
						}
					}
				}
			}
		}

		// 3. Rooms from alternative floors, partially available (≥80% of days)
		for (const floor of altFloors) {
			const maxGuestsAlt = floor === "couples" ? 2 : 1;
			if (guests <= maxGuestsAlt) {
				for (const r of rooms) {
					if (r.floor === floor && r.status !== "maintenance") {
						if (bookedRoomIds.has(r._id)) {
							const availDays = getAvailableDays(r._id);
							const pct = (availDays / range) * 100;
							if (pct >= 80) {
								candidates.push({
									room: r,
									reason: `Available ${Math.round(pct)}% on ${floor} floor`,
								});
							}
						}
					}
				}
			}
		}

		// Deduplicate by room ID and return max 5
		const seen = new Set<string>();
		return candidates
			.filter((c) => {
				if (seen.has(c.room._id)) return false;
				seen.add(c.room._id);
				return true;
			})
			.slice(0, 5);
	}, [
		rooms,
		selectedFloor,
		guests,
		bookedRoomIds,
		checkInDate,
		checkOutDate,
		getAvailableDays,
	]);

	// Helper to get pod display name
	const getPodDisplayName = (room: Room): string => {
		const qualityMap: Record<string, string> = {
			classic: "Classic Pearl",
			milk: "Milk Pearl",
			golden: "Golden Pearl",
			crystal: "Crystal Boba Suite",
			matcha: "Matcha Pearl",
		};
		const baseName = qualityMap[room.quality] || room.quality;
		return room.floor === "couples" ? `Twin ${baseName}` : baseName;
	};

	// Handle date changes
	const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(setCheckIn(e.target.value));
	};

	const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		dispatch(setCheckOut(e.target.value));
	};

	const handleGuestsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const val = parseInt(e.target.value);
		if (val <= 2) {
			dispatch(setGuests(val));
		}
	};

	// Navigate to room detail/checkout (placeholder)
	const handleSelectRoom = (roomId: string) => {
		console.log("Selected room:", roomId);
		// TODO: Navigate to checkout/room detail page
		alert(`Selected room ${roomId}. Checkout flow coming soon!`);
	};

	const isValidForm = checkIn && checkOut && checkIn < checkOut && guests > 0;
	const minCheckOut = checkIn ? new Date(checkIn + "T00:00:00") : new Date();
	minCheckOut.setDate(minCheckOut.getDate() + 1);

	return (
		<>
			<Navbar />
			<div className="booking-page">
				{/* Header */}
				<section className="booking-header">
					<h1>Find Your Perfect Room</h1>
					<p>Browse available accommodations for your dates</p>
				</section>

				{/* Filters */}
				<section className="booking-filters">
					<div className="booking-filters__row">
						<div className="booking-filters__field">
							<label>Check In</label>
							<div className="booking-filters__input-wrapper">
								<Calendar size={18} />
								<input
									type="date"
									value={checkIn}
									onChange={handleCheckInChange}
									min={new Date().toISOString().split("T")[0]}
									className="booking-filters__input"
								/>
							</div>
						</div>

						<div className="booking-filters__field">
							<label>Check Out</label>
							<div className="booking-filters__input-wrapper">
								<Calendar size={18} />
								<input
									type="date"
									value={checkOut}
									onChange={handleCheckOutChange}
									min={minCheckOut.toISOString().split("T")[0]}
									className="booking-filters__input"
								/>
							</div>
						</div>

						<div className="booking-filters__field">
							<label>Guests (Max 2)</label>
							<div className="booking-filters__input-wrapper">
								<Users size={18} />
								<select
									value={guests}
									onChange={handleGuestsChange}
									className="booking-filters__input"
								>
									<option value={1}>1 Guest</option>
									<option value={2}>2 Guests</option>
								</select>
							</div>
						</div>

						<div className="booking-filters__field">
							<label>Floor/Zone</label>
							<select
								value={selectedFloor}
								onChange={(e) =>
									setSelectedFloor(e.target.value as PodFloor | "")
								}
								className="booking-filters__input"
							>
								<option value="">Select a floor...</option>
								<option value="women-only">Women-Only</option>
								<option value="men-only">Men-Only</option>
								<option value="couples">Couples</option>
								<option value="business">Business/Quiet</option>
							</select>
						</div>
					</div>
				</section>

				{!isValidForm && (
					<section className="booking-message">
						<p>
							Please select check-in and check-out dates and a floor to see
							available rooms.
						</p>
					</section>
				)}

				{isValidForm && selectedFloor && (
					<>
						{/* Main Available Rooms */}
						<section className="booking-results">
							<h2>
								Available Rooms
								{mainAvailable.length > 0 && (
									<span className="booking-results__count">
										{mainAvailable.length} available
									</span>
								)}
							</h2>

							{mainAvailable.length === 0 ? (
								<p className="booking-results__empty">
									No rooms available for your selection on the {selectedFloor}{" "}
									floor.
									<br /> Check our suggestions below or try different dates.
								</p>
							) : (
								<div className="booking-results__grid">
									{mainAvailable.map((room) => (
										<div className="booking-card" key={room._id}>
											<div className="booking-card__header">
												<h3>{room.podId}</h3>
												<span className="booking-card__quality">
													{getPodDisplayName(room)}
												</span>
											</div>
											<div className="booking-card__details">
												<p>
													<strong>Price:</strong> ${room.pricePerNight}/night
												</p>
												<p>
													<strong>Capacity:</strong>{" "}
													{room.capacity === 2 ? "2 guests" : "1 guest"}
												</p>
												{room.dimensions && (
													<p>
														<strong>Size:</strong> {room.dimensions.length}" ×{" "}
														{room.dimensions.width}" × {room.dimensions.height}"
													</p>
												)}
											</div>
											<button
												className="booking-card__button"
												onClick={() => handleSelectRoom(room._id)}
											>
												Reserve Now
												<ChevronRight size={16} />
											</button>
										</div>
									))}
								</div>
							)}
						</section>

						{/* Close Matches / Suggestions */}
						{closeMatches.length > 0 && (
							<section className="booking-suggestions">
								<h2>Nearby Options</h2>
								<p className="booking-suggestions__subtitle">
									Other rooms that might work for you
								</p>
								<div className="booking-suggestions__grid">
									{closeMatches.map((match) => (
										<div
											className="booking-card booking-card--suggested"
											key={match.room._id}
										>
											<div className="booking-card__header">
												<h3>{match.room.podId}</h3>
												<span className="booking-card__quality">
													{getPodDisplayName(match.room)}
												</span>
											</div>
											<div className="booking-card__reason">{match.reason}</div>
											<div className="booking-card__details">
												<p>
													<strong>Price:</strong> ${match.room.pricePerNight}
													/night
												</p>
												<p>
													<strong>Capacity:</strong>{" "}
													{match.room.capacity === 2 ? "2 guests" : "1 guest"}
												</p>
											</div>
											<button
												className="booking-card__button"
												onClick={() => handleSelectRoom(match.room._id)}
											>
												View Option
												<ChevronRight size={16} />
											</button>
										</div>
									))}
								</div>
							</section>
						)}
					</>
				)}
			</div>
		</>
	);
};

export default Booking;
