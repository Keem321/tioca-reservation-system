import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../hooks";
import { useToast } from "../components/useToast";
import { useAnalyticsTracking } from "../hooks/useAnalytics";
import {
	useCreateReservationMutation,
	useGetAvailableSlotsQuery,
} from "../features/reservationsApi";
import {
	useCreateHoldMutation,
	useReleaseHoldMutation,
} from "../features/holdsApi";
import { useGetAmenityOfferingsQuery } from "../features/offeringsApi";
import {
	setPendingReservation,
	resetBooking,
	setHoldId,
} from "../features/bookingSlice";
import { resetGroupBooking } from "../features/groupBookingSlice";
// RootState type not needed directly due to typed selector hook
import type { BookingState } from "../features/bookingSlice";
import type { ReservationFormData } from "../types/reservation";
import type { Room } from "../types/room";
import type { AmenityOffering } from "../types/offering";
import Navbar from "../components/landing/Navbar";
import BookingBreadcrumb from "../components/booking/BookingBreadcrumb";
import { useFormatMoney } from "../hooks/useFormatMoney";
import {
	getRoomImage,
	getRoomDisplayLabel,
	getRoomQualityDescription,
} from "../utils/roomImages";
import "./BookingConfirmation.css";

// Type for group booking results passed from search
interface GroupSearchResults {
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
}

// Type for timeslot in group booking
interface GroupBookingTimeslot {
	id: string;
	checkIn: string;
	checkOut: string;
	members: Array<{
		id: string;
		numberOfGuests?: number;
		quality?: string;
		floor?: string;
	}>;
}

/**
 * BookingConfirmation Component
 *
 * Displays booking confirmation details and collects guest information.
 * Works for both authenticated users and guests.
 * Creates the reservation when proceeding to payment.
 */
const BookingConfirmation: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const toast = useToast();
	const { formatMoney } = useFormatMoney();
	const { checkIn, checkOut, guests, selectedRoom, holdId } = useAppSelector(
		(state) => state.booking as BookingState,
	);
	const { user } = useAppSelector((state) => state.auth);

	// Track analytics for confirm stage
	const { trackComplete } = useAnalyticsTracking("confirm");

	// Handle breadcrumb navigation
	const handleBreadcrumbClick = (step: number) => {
		if (step === 1) {
			// Navigate back to booking/search page
			navigate("/booking");
		}
	};

	// Check if this is a group booking from location state
	const isGroupBooking = location.state?.isGroupBooking || false;
	const groupResults: GroupSearchResults | undefined =
		location.state?.groupResults;
	const timeslots = useMemo(
		() =>
			(location.state?.timeslots || []) as Array<{
				id: string;
				checkIn: string;
				checkOut: string;
				members: Array<{
					id: string;
					numberOfGuests?: number;
					quality?: string;
					floor?: string;
				}>;
			}>,
		[location.state?.timeslots],
	);

	// Guest information form state - primary guest
	const [guestName, setGuestName] = useState(user?.name || "");
	const [guestEmail, setGuestEmail] = useState(user?.email || "");
	const [guestPhone, setGuestPhone] = useState("");

	// Group guest names (optional for non-primary guests)
	const [groupGuestNames, setGroupGuestNames] = useState<
		Record<string, string>
	>({});

	// Time selection state for individual booking
	const [checkInTime, setCheckInTime] = useState("");
	const [checkOutTime, setCheckOutTime] = useState("");

	// Time selection state for group booking (per timeslot)
	const [timeslotTimes, setTimeslotTimes] = useState<
		Record<
			string,
			{
				checkInTime: string;
				checkOutTime: string;
			}
		>
	>({});

	// Amenities selection state
	const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

	const [timeError, setTimeError] = useState("");

	// Hold state
	const [holdError, setHoldError] = useState("");
	const [isCreatingHold, setIsCreatingHold] = useState(false);
	const [groupHoldIds, setGroupHoldIds] = useState<string[]>([]);

	// Refs to prevent duplicate hold creation in React Strict Mode
	const holdCreationAttempted = useRef(false);
	const groupHoldCreationAttempted = useRef(false);

	// Get room from location state or Redux (individual booking only)
	const room = location.state?.room || selectedRoom;

	// Hold mutations
	const [createHold] = useCreateHoldMutation();
	const [releaseHold] = useReleaseHoldMutation();

	const { data: checkInSlotsData, isFetching: loadingCheckInSlots } =
		useGetAvailableSlotsQuery(
			{ roomId: room?._id || "", date: checkIn || "" },
			{ skip: !room || !checkIn },
		);

	const { data: checkOutSlotsData, isFetching: loadingCheckOutSlots } =
		useGetAvailableSlotsQuery(
			{ roomId: room?._id || "", date: checkOut || "" },
			{ skip: !room || !checkOut },
		);

	// Fetch amenities
	const { data: amenitiesData } = useGetAmenityOfferingsQuery(
		{ activeOnly: true },
		{ skip: isGroupBooking }, // Only needed for individual bookings for now
	);

	// Helper to convert 24-hour time to 12-hour AM/PM format
	const formatTimeAmPm = (time24: string): string => {
		const [hour, minute] = time24.split(":");
		const hourNum = parseInt(hour);
		const ampm = hourNum >= 12 ? "PM" : "AM";
		const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
		return `${hour12}:${minute} ${ampm}`;
	};

	// Helper to convert 12-hour AM/PM back to 24-hour for time comparison
	const convertAmPmTo24 = (timeAmPm: string): string => {
		const [time, ampm] = timeAmPm.split(" ");
		const [hour, minute] = time.split(":");
		let hourNum = parseInt(hour);
		if (ampm === "AM" && hourNum === 12) hourNum = 0;
		if (ampm === "PM" && hourNum !== 12) hourNum += 12;
		return `${String(hourNum).padStart(2, "0")}:${minute}`;
	};

	// Helper to generate arrival time slots
	// If date is today, only show times at least 2 hours in the future
	// Otherwise show all hour blocks from start to end of day
	const generateArrivalSlots = (dateStr: string): string[] => {
		const today = new Date();
		const checkDate = toLocalDate(dateStr);
		const isToday = today.toDateString() === checkDate.toDateString();

		const slots: string[] = [];

		if (isToday) {
			// Current time + 2 hours minimum
			const now = new Date();
			const startHour = now.getHours() + 2;
			const endHour = 23; // 11 PM is last option

			// If start hour goes past 11 PM, no slots available
			if (startHour > endHour) {
				return [];
			}

			for (let hour = startHour; hour <= endHour; hour++) {
				const ampm = hour < 12 ? "AM" : "PM";
				const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
				slots.push(`${displayHour}:00 ${ampm}`);
			}
		} else {
			// Show all hours from start to end of day
			// Standard hours: 12 AM to 11 PM (midnight to 11 PM)
			for (let hour = 0; hour <= 23; hour++) {
				const ampm = hour < 12 ? "AM" : "PM";
				const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
				slots.push(`${displayHour}:00 ${ampm}`);
			}
		}

		return slots;
	};

	// Helper to generate departure time slots
	// Always show all hour blocks from 9 AM to 2 PM (standard checkout times)
	const generateDepartureSlots = (): string[] => {
		const slots: string[] = [];
		// Standard departure hours: 9 AM to 2 PM
		for (let hour = 9; hour <= 14; hour++) {
			const ampm = hour < 12 ? "AM" : "PM";
			const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
			slots.push(`${displayHour}:00 ${ampm}`);
		}
		return slots;
	};

	// Parse dates as local to avoid timezone shifts from Date parsing of YYYY-MM-DD
	const toLocalDate = (value: string) => new Date(`${value}T00:00:00`);

	// Check if individual booking check-in is today
	const isCheckInToday = (() => {
		if (!isGroupBooking && checkIn) {
			const today = new Date();
			const checkInDateLocal = toLocalDate(checkIn);
			return today.toDateString() === checkInDateLocal.toDateString();
		}
		return false;
	})();

	// Derive slots from query data and convert to AM/PM
	// For individual booking, we now use the helper functions for more control
	const checkInSlots = isCheckInToday
		? generateArrivalSlots(checkIn)
		: (checkInSlotsData?.slots || []).map(formatTimeAmPm);

	const rawCheckOutSlots = (checkOutSlotsData?.slots || []).map(formatTimeAmPm);
	const checkoutSlots =
		checkIn === checkOut && checkInTime
			? rawCheckOutSlots.filter((slot) => {
					const slotIn24 = convertAmPmTo24(slot);
					const checkInIn24 = convertAmPmTo24(checkInTime);
					return slotIn24 > checkInIn24;
				})
			: rawCheckOutSlots;

	const [createReservation, { isLoading, error }] =
		useCreateReservationMutation();

	// Create hold on mount and release on unmount
	useEffect(() => {
		let mounted = true;
		let createdHoldId: string | null = null;

		const createRoomHold = async () => {
			// Don't create if we already have a hold or already attempted
			if (
				!room ||
				!checkIn ||
				!checkOut ||
				holdId ||
				holdCreationAttempted.current
			) {
				return;
			}

			// Mark as attempted to prevent duplicate creation (React Strict Mode)
			holdCreationAttempted.current = true;

			setIsCreatingHold(true);
			setHoldError("");

			try {
				const hold = await createHold({
					roomId: room._id,
					checkInDate: checkIn,
					checkOutDate: checkOut,
					stage: "confirmation",
				}).unwrap();

				// Always update Redux state (persists across remounts)
				dispatch(setHoldId(hold._id));
				createdHoldId = hold._id;

				// Only show toast if still mounted
				if (mounted) {
					toast.success(`${room.podId} is now reserved for you`);
				}
			} catch (err) {
				// Reset flag on error so user can retry if needed
				holdCreationAttempted.current = false;

				const error = err as { data?: { error?: string } };
				const errorMessage =
					error?.data?.error ||
					"Failed to reserve this room. It may no longer be available.";
				setHoldError(errorMessage);

				if (mounted) {
					toast.error(errorMessage);
				}
			} finally {
				// Always reset loading state
				setIsCreatingHold(false);
			}
		};

		createRoomHold();

		// Cleanup: release hold when component unmounts
		return () => {
			mounted = false;
			const holdToRelease = createdHoldId || holdId;
			if (holdToRelease) {
				releaseHold(holdToRelease).catch((err) => {
					console.error("Failed to release hold:", err);
				});
				dispatch(setHoldId(null));
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Run only on mount

	// Create holds for all group rooms on mount
	useEffect(() => {
		let mounted = true;
		const createdHoldIds: string[] = [];

		const createGroupRoomHolds = async () => {
			// Don't create if we don't have group data, already have holds, or already attempted
			if (
				!isGroupBooking ||
				!groupResults ||
				groupHoldIds.length > 0 ||
				groupHoldCreationAttempted.current
			) {
				return;
			}

			// Mark as attempted to prevent duplicate creation (React Strict Mode)
			groupHoldCreationAttempted.current = true;

			// Extract all unique room IDs from group results
			const roomIds = groupResults.primary.map(
				(assignment) => assignment.roomId,
			);

			if (roomIds.length === 0) {
				return;
			}

			// Extract earliest check-in and latest check-out across all timeslots
			let earliestCheckIn: Date | null = null;
			let latestCheckOut: Date | null = null;

			for (const timeslot of timeslots) {
				const checkInStr = timeslot.checkIn?.split("T")[0] || timeslot.checkIn;
				const checkOutStr =
					timeslot.checkOut?.split("T")[0] || timeslot.checkOut;

				const timeslotCheckIn = toLocalDate(checkInStr);
				const timeslotCheckOut = toLocalDate(checkOutStr);

				if (!earliestCheckIn || timeslotCheckIn < earliestCheckIn) {
					earliestCheckIn = timeslotCheckIn;
				}
				if (!latestCheckOut || timeslotCheckOut > latestCheckOut) {
					latestCheckOut = timeslotCheckOut;
				}
			}

			if (!earliestCheckIn || !latestCheckOut) {
				return;
			}

			const earliestCheckInStr = earliestCheckIn.toISOString().split("T")[0];
			const latestCheckOutStr = latestCheckOut.toISOString().split("T")[0];

			setIsCreatingHold(true);
			setHoldError("");

			try {
				// Create holds sequentially to ensure the browser applies the
				// session cookie from the first response before subsequent requests.
				// Parallel requests can create separate guest sessions, causing
				// reservation conflicts later. Sequential creation guarantees a
				// single consistent session for all holds.
				const holdIds: string[] = [];
				for (const roomId of roomIds) {
					const hold = await createHold({
						roomId,
						checkInDate: earliestCheckInStr,
						checkOutDate: latestCheckOutStr,
						stage: "confirmation",
					}).unwrap();
					holdIds.push(hold._id);
				}

				// Always update state (persists across remounts)
				setGroupHoldIds(holdIds);
				createdHoldIds.push(...holdIds);

				// Only show toast if still mounted
				if (mounted) {
					toast.success(
						`Reserved ${roomIds.length} room${
							roomIds.length > 1 ? "s" : ""
						} for group booking`,
					);
				}
			} catch (err) {
				// Reset flag on error so user can retry if needed
				groupHoldCreationAttempted.current = false;

				const error = err as { data?: { error?: string } };
				const errorMessage =
					error?.data?.error ||
					"Failed to reserve rooms. It may no longer be available.";
				setHoldError(errorMessage);

				if (mounted) {
					toast.error(errorMessage);
				}
			} finally {
				// Always reset loading state
				setIsCreatingHold(false);
			}
		};

		createGroupRoomHolds();

		// Cleanup: release holds when component unmounts
		return () => {
			mounted = false;
			const holdsToRelease =
				createdHoldIds.length > 0 ? createdHoldIds : groupHoldIds;
			if (holdsToRelease.length > 0) {
				Promise.all(
					holdsToRelease.map((holdId) =>
						releaseHold(holdId).catch((err) => {
							console.error("Failed to release hold:", err);
						}),
					),
				);
				setGroupHoldIds([]);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isGroupBooking]); // Run only when isGroupBooking changes

	// Redirect if no room selected or missing booking data
	useEffect(() => {
		if (isGroupBooking) {
			// For group booking, validate group data
			if (!groupResults || !timeslots || timeslots.length === 0) {
				navigate("/booking");
			}
		} else {
			// For individual booking, validate individual data
			if (!room || !checkIn || !checkOut) {
				navigate("/booking");
			}
		}
	}, [
		isGroupBooking,
		groupResults,
		timeslots,
		room,
		checkIn,
		checkOut,
		navigate,
	]);

	const handleProceedToPayment = async () => {
		// For individual bookings
		if (!isGroupBooking) {
			if (
				!room ||
				!checkIn ||
				!checkOut ||
				!guestName ||
				!guestEmail ||
				!checkInTime ||
				!checkOutTime
			) {
				setTimeError("Please select check-in and check-out times.");
				return;
			}

			const isSameDayCheckout = checkIn === checkOut;
			if (isSameDayCheckout && checkOutTime <= checkInTime) {
				setTimeError("Check-out time must be after check-in time.");
				return;
			}

			setTimeError("");

			// Calculate total price (use local date parsing to avoid timezone shifts)
			const checkInDate = toLocalDate(checkIn);
			const checkOutDate = toLocalDate(checkOut);
			const nights = Math.ceil(
				(checkOutDate.getTime() - checkInDate.getTime()) /
					(1000 * 60 * 60 * 24),
			);

			// Calculate room price
			let totalPrice = (room.offering?.basePrice || 0) * nights;

			// Add amenity prices
			if (selectedAmenities.length > 0 && amenitiesData) {
				for (const amenityId of selectedAmenities) {
					const amenity = amenitiesData.find(
						(a: AmenityOffering) => a._id === amenityId,
					);
					if (amenity) {
						if (amenity.priceType === "per-night") {
							totalPrice += amenity.basePrice * nights;
						} else {
							totalPrice += amenity.basePrice;
						}
					}
				}
			}

			const checkInDateTime = combineDateTime(checkIn, checkInTime);
			const checkOutDateTime = combineDateTime(checkOut, checkOutTime);

			const reservationData: ReservationFormData = {
				roomId: room._id,
				offeringId: room.offering?._id || room.offeringId || "",
				userId: user?.id,
				guestName,
				guestEmail,
				guestPhone: guestPhone || undefined,
				checkInDate: checkInDateTime,
				checkOutDate: checkOutDateTime,
				numberOfGuests: guests,
				selectedAmenities: selectedAmenities,
				totalPrice,
				status: "pending",
				paymentStatus: "unpaid",
				holdId: holdId || undefined,
			};

			try {
				const reservation = await createReservation(reservationData).unwrap();
				dispatch(setPendingReservation(reservation));
				trackComplete();
				navigate("/payment");
			} catch (err) {
				const apiError = err as { data?: { error?: string }; status?: number };
				console.error("Failed to create reservation:", {
					status: apiError.status,
					error: apiError.data?.error,
					fullError: err,
				});
			}
			return;
		}

		// For group bookings
		if (!guestName || !guestEmail) {
			setTimeError("Please provide primary guest name and email.");
			return;
		}

		// Check all timeslots have times selected
		const missingTimes = timeslots.some(
			(ts: GroupBookingTimeslot) =>
				!timeslotTimes[ts.id]?.checkInTime ||
				!timeslotTimes[ts.id]?.checkOutTime,
		);
		if (missingTimes) {
			setTimeError(
				"Please select arrival and departure times for all periods.",
			);
			return;
		}

		// Check that holds were created successfully
		if (groupHoldIds.length === 0) {
			setTimeError("Rooms are not reserved. Please try again.");
			return;
		}

		setTimeError("");
		setIsCreatingHold(true);

		try {
			// Collect all room IDs and calculate totals for group booking
			const allRoomIds: string[] = [];
			let totalGroupPrice = 0;
			let totalGroupGuests = 0;
			let earliestCheckIn: Date | null = null;
			let latestCheckOut: Date | null = null;
			let checkInTime = "";
			let checkOutTime = "";

			// Collect all rooms and calculate aggregated data
			for (const timeslot of timeslots) {
				const timeslotAssignments = groupResults!.primary.filter((assignment) =>
					timeslot.members.some((m) => m.id === assignment.memberId),
				);

				// Get times for this timeslot
				const times = timeslotTimes[timeslot.id];
				if (!times) continue;

				// Parse dates
				const checkInStr = timeslot.checkIn?.split("T")[0] || timeslot.checkIn;
				const checkOutStr =
					timeslot.checkOut?.split("T")[0] || timeslot.checkOut;

				// Track earliest check-in and latest check-out
				const timeslotCheckIn = toLocalDate(checkInStr);
				const timeslotCheckOut = toLocalDate(checkOutStr);

				if (!earliestCheckIn || timeslotCheckIn < earliestCheckIn) {
					earliestCheckIn = timeslotCheckIn;
					checkInTime = times.checkInTime;
				}
				if (!latestCheckOut || timeslotCheckOut > latestCheckOut) {
					latestCheckOut = timeslotCheckOut;
					checkOutTime = times.checkOutTime;
				}

				// Calculate nights for pricing
				const nights = Math.ceil(
					(timeslotCheckOut.getTime() - timeslotCheckIn.getTime()) /
						(1000 * 60 * 60 * 24),
				);

				for (const assignment of timeslotAssignments) {
					const member = timeslot.members.find(
						(m) => m.id === assignment.memberId,
					);
					if (!member) continue;

					// Add room ID
					const room = assignment.room;
					allRoomIds.push(room._id);

					// Calculate price for this room
					const roomPrice = (room.offering?.basePrice || 0) * nights;
					totalGroupPrice += roomPrice;

					// Add guests
					totalGroupGuests += member.numberOfGuests || 1;
				}
			}

			if (allRoomIds.length === 0 || !earliestCheckIn || !latestCheckOut) {
				setTimeError("Failed to prepare group reservation. Please try again.");
				setIsCreatingHold(false);
				return;
			}

			// Create single group reservation
			const earliestCheckInStr = earliestCheckIn.toISOString().split("T")[0];
			const latestCheckOutStr = latestCheckOut.toISOString().split("T")[0];

			const checkInDateTime = combineDateTime(earliestCheckInStr, checkInTime);
			const checkOutDateTime = combineDateTime(latestCheckOutStr, checkOutTime);

			// Get first room's offering for the reservation (all rooms should have compatible offerings)
			const firstAssignment = groupResults!.primary[0];
			const offeringId =
				firstAssignment.room.offering?._id ||
				firstAssignment.room.offeringId ||
				"";

			const groupReservationData: ReservationFormData = {
				roomIds: allRoomIds, // Multiple rooms in one reservation
				offeringId,
				userId: user?.id,
				guestName,
				guestEmail,
				guestPhone: guestPhone || undefined,
				checkInDate: checkInDateTime,
				checkOutDate: checkOutDateTime,
				numberOfGuests: totalGroupGuests,
				selectedAmenities: [],
				totalPrice: totalGroupPrice,
				status: "pending",
				paymentStatus: "unpaid",
			};

			// Create single group reservation
			const reservation =
				await createReservation(groupReservationData).unwrap();

			console.log("[BookingConfirmation] Group reservation created:", {
				reservationId: reservation._id,
				roomCount: reservation.roomIds?.length || 0,
				totalPrice: reservation.totalPrice,
				guestCount: reservation.numberOfGuests,
				checkIn: reservation.checkInDate,
				checkOut: reservation.checkOutDate,
			});

			// Store reservation and navigate to payment
			dispatch(setPendingReservation(reservation));
			trackComplete();
			navigate("/payment");
		} catch (err) {
			const apiError = err as { data?: { error?: string }; status?: number };
			console.error("Failed to create group reservation:", {
				status: apiError.status,
				error: apiError.data?.error,
				fullError: err,
			});
			const errorMessage =
				apiError?.data?.error ||
				"Failed to create reservation. Please try again.";
			setTimeError(errorMessage);
			toast.error(errorMessage);
			setIsCreatingHold(false);
		}
	};

	const handleCancel = () => {
		if (isGroupBooking) {
			dispatch(resetGroupBooking());
		} else {
			dispatch(resetBooking());
		}
		navigate("/booking");
	};

	const handleSetGroupGuestName = (memberId: string, name: string) => {
		setGroupGuestNames((prev) => ({
			...prev,
			[memberId]: name,
		}));
	};

	const handleSetTimeslotTime = (
		timeslotId: string,
		type: "checkIn" | "checkOut",
		time: string,
	) => {
		setTimeslotTimes((prev) => ({
			...prev,
			[timeslotId]: {
				...(prev[timeslotId] || { checkInTime: "", checkOutTime: "" }),
				[type === "checkIn" ? "checkInTime" : "checkOutTime"]: time,
			},
		}));
	};

	if (isGroupBooking && (!groupResults || !timeslots)) {
		return null;
	}

	if (!isGroupBooking && (!room || !checkIn || !checkOut)) {
		return null;
	}

	const combineDateTime = (date: string, time: string) => {
		const time24 = convertAmPmTo24(time);
		return `${date}T${time24}:00`;
	};

	// Group Booking Render
	if (isGroupBooking && groupResults && timeslots.length > 0) {
		console.log("Group booking data:", { groupResults, timeslots });
		const firstTimeslot = timeslots[0];
		const totalRooms = groupResults.primary.length;
		const totalGuests = groupResults.primary.reduce((sum, assignment) => {
			const member = firstTimeslot.members.find(
				(m: { id: string }) => m.id === assignment.memberId,
			);
			return sum + (member?.numberOfGuests || 1);
		}, 0);

		return (
			<>
				<Navbar />
				<BookingBreadcrumb
					currentStep={2}
					onStepClick={handleBreadcrumbClick}
				/>
				<div className="booking-confirmation">
					<div className="booking-confirmation__container">
						<div className="booking-confirmation__header">
							<h1>Confirm Group Booking</h1>
							<p className="booking-confirmation__subtitle">
								{totalRooms} room{totalRooms > 1 ? "s" : ""} for {totalGuests}{" "}
								guest{totalGuests > 1 ? "s" : ""}
							</p>
						</div>

						{/* Primary Guest Information */}
						<div className="booking-confirmation__section">
							<h2>Primary Guest Information</h2>
							<p
								style={{
									fontSize: "0.9rem",
									color: "var(--color-text-secondary)",
									marginBottom: "1rem",
								}}
							>
								Primary contact for the reservation
							</p>
							<div className="guest-form">
								<div className="form-group">
									<label htmlFor="guestName">Full Name *</label>
									<input
										id="guestName"
										type="text"
										value={guestName}
										onChange={(e) => setGuestName(e.target.value)}
										required
									/>
								</div>
								<div className="form-group">
									<label htmlFor="guestEmail">Email Address *</label>
									<input
										id="guestEmail"
										type="email"
										value={guestEmail}
										onChange={(e) => setGuestEmail(e.target.value)}
										required
									/>
								</div>
								<div className="form-group">
									<label htmlFor="guestPhone">Phone Number</label>
									<input
										id="guestPhone"
										type="tel"
										value={guestPhone}
										onChange={(e) => setGuestPhone(e.target.value)}
									/>
								</div>
							</div>
						</div>

						{/* Additional Guest Names (Optional) */}
						{totalGuests > 1 &&
							(() => {
								// Create array of all guests beyond the primary (first) guest
								const additionalGuests: Array<{
									guestNumber: number;
									roomId: string;
									memberId: string;
									guestIndexInRoom: number;
								}> = [];
								let guestCounter = 1; // Primary guest is 1

								groupResults.primary.forEach((assignment) => {
									const member = firstTimeslot.members.find(
										(m: { id: string }) => m.id === assignment.memberId,
									);
									const numGuests = member?.numberOfGuests || 1;

									for (let i = 0; i < numGuests; i++) {
										if (guestCounter > 1) {
											// Skip primary guest
											additionalGuests.push({
												guestNumber: guestCounter,
												roomId: assignment.room.podId,
												memberId: `${assignment.memberId}-guest-${i}`,
												guestIndexInRoom: i,
											});
										}
										guestCounter++;
									}
								});

								return (
									<div className="booking-confirmation__section">
										<h2>Additional Guests (Optional)</h2>
										<p
											style={{
												fontSize: "0.9rem",
												color: "var(--color-text-secondary)",
												marginBottom: "1rem",
											}}
										>
											Provide names for other guests in your group
										</p>
										<div className="guest-form">
											{additionalGuests.map((guest) => (
												<div className="form-group" key={guest.memberId}>
													<label htmlFor={`guest-${guest.memberId}`}>
														Guest {guest.guestNumber} - Room {guest.roomId}
													</label>
													<input
														id={`guest-${guest.memberId}`}
														type="text"
														placeholder="Guest name (optional)"
														value={groupGuestNames[guest.memberId] || ""}
														onChange={(e) =>
															handleSetGroupGuestName(
																guest.memberId,
																e.target.value,
															)
														}
													/>
												</div>
											))}
										</div>
									</div>
								);
							})()}
						{/* Timeslot Details with Arrival/Departure */}
						{timeslots.map((timeslot: GroupBookingTimeslot) => {
							const timeslotAssignments = groupResults.primary.filter(
								(assignment) =>
									timeslot.members.some(
										(m: { id: string }) => m.id === assignment.memberId,
									),
							);

							if (timeslotAssignments.length === 0) return null;

							// Ensure dates are in YYYY-MM-DD format before parsing
							const checkInStr =
								timeslot.checkIn?.split("T")[0] || timeslot.checkIn;
							const checkOutStr =
								timeslot.checkOut?.split("T")[0] || timeslot.checkOut;

							if (!checkInStr || !checkOutStr) {
								console.error("Missing dates for timeslot:", timeslot);
								return null;
							}

							const checkInDate = toLocalDate(checkInStr);
							const checkOutDate = toLocalDate(checkOutStr);

							return (
								<div
									key={timeslot.id}
									className="booking-confirmation__section"
									style={{
										background: "var(--color-white, white)",
										padding: "1.5rem",
										borderRadius: "12px",
										border: "2px solid rgba(188,143,103,0.2)",
									}}
								>
									<h3
										style={{
											marginTop: 0,
											marginBottom: "1rem",
											color: "var(--color-deep-walnut)",
										}}
									>
										{checkInDate.toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										})}{" "}
										-{" "}
										{checkOutDate.toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
										})}
									</h3>

									{/* Arrival & Departure Times */}
									<div className="guest-form">
										<div className="form-group">
											<label>Arrival Time *</label>
											<select
												value={timeslotTimes[timeslot.id]?.checkInTime || ""}
												onChange={(e) =>
													handleSetTimeslotTime(
														timeslot.id,
														"checkIn",
														e.target.value,
													)
												}
												required
											>
												<option value="">Select arrival time</option>
												{generateArrivalSlots(checkInStr).map((slot) => (
													<option key={slot} value={slot}>
														{slot}
													</option>
												))}
											</select>
										</div>
										<div className="form-group">
											<label>Departure Time *</label>
											<select
												value={timeslotTimes[timeslot.id]?.checkOutTime || ""}
												onChange={(e) =>
													handleSetTimeslotTime(
														timeslot.id,
														"checkOut",
														e.target.value,
													)
												}
												required
											>
												<option value="">Select departure time</option>
												{generateDepartureSlots().map((slot) => (
													<option key={slot} value={slot}>
														{slot}
													</option>
												))}
											</select>
										</div>
									</div>

									{/* Rooms in this timeslot */}
									<div style={{ marginTop: "1rem" }}>
										<h4
											style={{
												fontSize: "1rem",
												marginBottom: "0.75rem",
												color: "var(--color-text-primary)",
											}}
										>
											Rooms ({timeslotAssignments.length})
										</h4>
										<div style={{ display: "grid", gap: "0.75rem" }}>
											{timeslotAssignments.map((assignment) => (
												<div
													key={assignment.memberId}
													style={{
														background: "var(--color-linen)",
														padding: "1rem",
														borderRadius: "8px",
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
													}}
												>
													<div>
														<div
															style={{
																fontWeight: 600,
																color: "var(--color-deep-walnut)",
															}}
														>
															{assignment.room.podId}
														</div>
														<div
															style={{
																fontSize: "0.9rem",
																color: "var(--color-text-secondary)",
																textTransform: "capitalize",
															}}
														>
															{assignment.quality} • {assignment.floor}
														</div>
													</div>
													{assignment.isProximate && (
														<div
															style={{
																fontSize: "0.85rem",
																color: "var(--color-secondary)",
																fontWeight: 500,
															}}
														>
															🔗 Adjacent
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								</div>
							);
						})}

						{timeError && (
							<div className="booking-confirmation__error">{timeError}</div>
						)}

						{/* Actions */}
						<div className="booking-confirmation__actions">
							<button
								onClick={handleCancel}
								className="booking-confirmation__button booking-confirmation__button--cancel"
							>
								Cancel
							</button>
							<button
								onClick={handleProceedToPayment}
								className="booking-confirmation__button booking-confirmation__button--primary"
								disabled={
									!guestName ||
									!guestEmail ||
									timeslots.some(
										(ts: GroupBookingTimeslot) =>
											!timeslotTimes[ts.id]?.checkInTime ||
											!timeslotTimes[ts.id]?.checkOutTime,
									)
								}
							>
								Proceed to Payment
							</button>
						</div>
					</div>
				</div>
			</>
		);
	}

	// Individual Booking Render (existing code continues below)
	// Calculate booking details
	const checkInDate = toLocalDate(checkIn);
	const checkOutDate = toLocalDate(checkOut);
	const nights = Math.ceil(
		(checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	// Calculate total price including amenities
	const totalPrice = useMemo(() => {
		let price = (room.offering?.basePrice || 0) * nights;

		// Add amenity prices
		if (selectedAmenities.length > 0 && amenitiesData) {
			selectedAmenities.forEach((amenityId) => {
				const amenity = amenitiesData.find(
					(a: AmenityOffering) => a._id === amenityId,
				);
				if (amenity) {
					if (amenity.priceType === "per-night") {
						price += amenity.basePrice * nights;
					} else {
						price += amenity.basePrice;
					}
				}
			});
		}

		return price;
	}, [
		room.offering?.basePrice,
		nights,
		selectedAmenities.length,
		selectedAmenities,
		amenitiesData,
	]);

	const roomImage = getRoomImage(room.quality, room.floor);
	const roomLabel = getRoomDisplayLabel(room.quality, room.floor);
	const roomDescription = getRoomQualityDescription(room.quality);

	return (
		<>
			<Navbar />
			<BookingBreadcrumb currentStep={2} onStepClick={handleBreadcrumbClick} />
			<div className="booking-confirmation">
				<div className="booking-confirmation__container">
					<div className="booking-confirmation__header">
						<h1>Confirm Your Booking</h1>
						<p className="booking-confirmation__subtitle">
							Please review your reservation details before proceeding to
							payment
						</p>
					</div>

					{/* Hold status messages */}
					{isCreatingHold && (
						<div
							className="booking-confirmation__notice"
							style={{
								background: "rgba(168, 100, 52, 0.1)",
								padding: "1rem",
								borderRadius: "8px",
								marginBottom: "1rem",
							}}
						>
							<p style={{ margin: 0, textAlign: "center" }}>
								🔒 Reserving this room for you...
							</p>
						</div>
					)}

					{holdError && (
						<div
							className="booking-confirmation__error"
							style={{
								background: "rgba(220, 53, 69, 0.1)",
								border: "2px solid #dc3545",
								padding: "1rem",
								borderRadius: "8px",
								marginBottom: "1rem",
							}}
						>
							<h3 style={{ marginTop: 0 }}>⚠️ Room Unavailable</h3>
							<p style={{ marginBottom: 0 }}>{holdError}</p>
							<button
								onClick={() => navigate("/booking")}
								style={{
									marginTop: "1rem",
									padding: "0.5rem 1rem",
									background: "var(--color-primary)",
									color: "white",
									border: "none",
									borderRadius: "8px",
									cursor: "pointer",
								}}
							>
								Search for Other Rooms
							</button>
						</div>
					)}

					{holdId && !isCreatingHold && !holdError && (
						<div
							className="booking-confirmation__notice"
							style={{
								background: "rgba(40, 167, 69, 0.1)",
								border: "2px solid #28a745",
								padding: "1rem",
								borderRadius: "8px",
								marginBottom: "1rem",
								textAlign: "center",
							}}
						>
							<p style={{ margin: 0 }}>
								✅ <strong>Room Reserved!</strong> This room is held for you for
								the next 5 minutes.
							</p>
						</div>
					)}

					{/* Guest Information Form */}
					<div className="booking-confirmation__section">
						<h2>Guest Information</h2>
						<div className="guest-form">
							<div className="form-group">
								<label htmlFor="guestName">Full Name *</label>
								<input
									id="guestName"
									type="text"
									value={guestName}
									onChange={(e) => setGuestName(e.target.value)}
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="guestEmail">Email Address *</label>
								<input
									id="guestEmail"
									type="email"
									value={guestEmail}
									onChange={(e) => setGuestEmail(e.target.value)}
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="guestPhone">Phone Number</label>
								<input
									id="guestPhone"
									type="tel"
									value={guestPhone}
									onChange={(e) => setGuestPhone(e.target.value)}
								/>
							</div>
						</div>
					</div>

					{/* Check-In/Out Time Selection */}
					<div className="booking-confirmation__section">
						<h2>Arrival & Departure Times</h2>
						{isCheckInToday && (
							<p className="booking-confirmation__notice">
								Note: At least 2 hours are needed to prepare the room before
								arrival.
							</p>
						)}
						<div className="guest-form">
							<div className="form-group">
								<label htmlFor="checkInTime">
									Arrival Time on{" "}
									{new Date(checkIn + "T00:00:00").toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})}{" "}
									*
								</label>
								{loadingCheckInSlots ? (
									<p>Loading available times...</p>
								) : (
									<select
										id="checkInTime"
										value={checkInTime}
										onChange={(e) => setCheckInTime(e.target.value)}
										required
									>
										<option value="">Select a time</option>
										{checkInSlots.map((slot) => (
											<option key={slot} value={slot}>
												{slot}
											</option>
										))}
									</select>
								)}
							</div>
							<div className="form-group">
								<label htmlFor="checkOutTime">
									Departure Time on{" "}
									{new Date(checkOut + "T00:00:00").toLocaleDateString(
										"en-US",
										{ month: "short", day: "numeric" },
									)}{" "}
									*
								</label>
								{loadingCheckOutSlots ? (
									<p>Loading available times...</p>
								) : (
									<select
										id="checkOutTime"
										value={checkOutTime}
										onChange={(e) => setCheckOutTime(e.target.value)}
										required
									>
										<option value="">Select a time</option>
										{checkoutSlots.map((slot) => (
											<option key={slot} value={slot}>
												{slot}
											</option>
										))}
									</select>
								)}
							</div>
						</div>
						{timeError && (
							<p className="booking-confirmation__error">{timeError}</p>
						)}
					</div>

					{error && (
						<div className="booking-confirmation__error">
							{(error as { data?: { error?: string } })?.data?.error ||
								"Failed to create reservation. Please try again."}
						</div>
					)}

					{checkInTime && checkOutTime && (
						<div className="booking-confirmation__content">
							{/* Room Details */}
							<div className="booking-confirmation__section">
								<h2>Room Details</h2>
								<div className="booking-confirmation__room-image">
									<img
										src={roomImage}
										alt={roomLabel}
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
								</div>
								<div className="detail-item">
									<span className="detail-label">Pod ID:</span>
									<span className="detail-value">{room.podId}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Type:</span>
									<span className="detail-value">{roomLabel}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Description:</span>
									<span className="detail-value">{roomDescription}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Floor:</span>
									<span className="detail-value">
										{room.floor.charAt(0).toUpperCase() + room.floor.slice(1)}
									</span>
								</div>
							</div>

							{/* Booking Details */}
							<div className="booking-confirmation__section">
								<h2>Booking Details</h2>
								<div className="detail-item">
									<span className="detail-label">Check-in:</span>
									<span className="detail-value">
										{checkInDate.toLocaleDateString("en-US", {
											weekday: "long",
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Check-out:</span>
									<span className="detail-value">
										{checkOutDate.toLocaleDateString("en-US", {
											weekday: "long",
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Number of Nights:</span>
									<span className="detail-value">{nights}</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Number of Guests:</span>
									<span className="detail-value">{guests}</span>
								</div>
							</div>

							{/* Amenities Selection */}
							{amenitiesData && amenitiesData.length > 0 && (
								<div className="booking-confirmation__section amenities-section">
									<h2>Add Amenities (Optional)</h2>
									<p className="amenities-description">
										Enhance your stay with additional amenities
									</p>
									<div className="amenities-grid">
										{amenitiesData.map((amenity: AmenityOffering) => (
											<label
												key={amenity._id}
												className={`amenity-card ${
													selectedAmenities.includes(amenity._id)
														? "selected"
														: ""
												}`}
											>
												<input
													type="checkbox"
													checked={selectedAmenities.includes(amenity._id)}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedAmenities([
																...selectedAmenities,
																amenity._id,
															]);
														} else {
															setSelectedAmenities(
																selectedAmenities.filter(
																	(id) => id !== amenity._id,
																),
															);
														}
													}}
												/>
												<div className="amenity-info">
													<div className="amenity-name">{amenity.name}</div>
													{amenity.description && (
														<div className="amenity-description">
															{amenity.description}
														</div>
													)}
													<div className="amenity-price">
														{formatMoney(amenity.basePrice)}
														{amenity.priceType === "per-night"
															? " /night"
															: " (flat)"}
													</div>
												</div>
											</label>
										))}
									</div>
								</div>
							)}

							{/* Price Breakdown */}
							<div className="booking-confirmation__section">
								<h2>Price Breakdown</h2>
								<div className="detail-item">
									<span className="detail-label">Price per Night:</span>
									<span className="detail-value">
										{formatMoney(room.offering?.basePrice || 0)}
									</span>
								</div>
								<div className="detail-item">
									<span className="detail-label">Number of Nights:</span>
									<span className="detail-value">{nights}</span>
								</div>
								{selectedAmenities.length > 0 && amenitiesData && (
									<>
										<div
											style={{
												borderTop: "1px solid #ddd",
												margin: "1rem 0",
												paddingTop: "1rem",
											}}
										>
											<p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
												Selected Amenities:
											</p>
											{selectedAmenities.map((amenityId) => {
												const amenity = amenitiesData.find(
													(a: AmenityOffering) => a._id === amenityId,
												);
												if (!amenity) return null;
												const amenityTotal =
													amenity.priceType === "per-night"
														? (amenity.basePrice * nights) / 100
														: amenity.basePrice / 100;
												return (
													<div
														key={amenityId}
														className="detail-item"
														style={{ fontSize: "0.95rem" }}
													>
														<span className="detail-label">
															{amenity.name}:
														</span>
														<span className="detail-value">
															${amenityTotal.toFixed(2)}
														</span>
													</div>
												);
											})}
										</div>
									</>
								)}
								<div className="detail-item detail-item--total">
									<span className="detail-label">Total Price:</span>
									<span className="detail-value">
										{formatMoney(totalPrice)}
									</span>
								</div>
							</div>
						</div>
					)}

					<div className="booking-confirmation__actions">
						<button
							onClick={handleCancel}
							className="booking-confirmation__button booking-confirmation__button--cancel"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							onClick={handleProceedToPayment}
							className="booking-confirmation__button booking-confirmation__button--primary"
							disabled={
								isLoading ||
								!!error ||
								!guestName ||
								!guestEmail ||
								!checkInTime ||
								!checkOutTime ||
								isCreatingHold ||
								!!holdError ||
								!holdId
							}
						>
							{isLoading
								? "Creating Reservation..."
								: isCreatingHold
									? "Reserving Room..."
									: "Proceed to Payment"}
						</button>
					</div>
					{(!guestName || !guestEmail || !checkInTime || !checkOutTime) && (
						<p
							className="booking-confirmation__info"
							style={{
								textAlign: "center",
								marginTop: "1rem",
								color: "#666",
							}}
						>
							Please fill in all required fields to proceed.
						</p>
					)}
				</div>
			</div>
		</>
	);
};

export default BookingConfirmation;
