import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Calendar, Building, Sparkles } from "lucide-react";
import { setCheckIn, setCheckOut, setZone, setQuality } from "../../features/bookingSlice";
import type { RootState } from "../../store";
import type { PodFloor, PodQuality } from "../../types/room";
import "./BookingSearchForm.css";

/**
 * BookingSearchForm Component
 *
 * Form for searching available pods with filters for dates, floor type, and quality level.
 * Uses Redux to manage form state.
 */

const zones: Array<{ value: PodFloor; label: string; icon: string }> = [
	{ value: "women-only", label: "Women-Only Floor", icon: "♀" },
	{ value: "men-only", label: "Men-Only Floor", icon: "♂" },
	{ value: "couples", label: "Couples Floor", icon: "👥" },
	{ value: "business", label: "Business/Quiet Floor", icon: "💼" },
];

const qualities: Array<{
	value: PodQuality;
	label: string;
	price: number;
	desc: string;
	womenOnly?: boolean;
}> = [
	{ value: "classic", label: "Classic Pearl", price: 65, desc: "Essential comfort" },
	{ value: "milk", label: "Milk Pearl", price: 75, desc: "Enhanced space" },
	{ value: "golden", label: "Golden Pearl", price: 95, desc: "Premium experience" },
	{ value: "crystal", label: "Crystal Boba Suite", price: 155, desc: "First-class luxury" },
	{ value: "matcha", label: "Matcha Pearl", price: 95, desc: "Women-only exclusive", womenOnly: true },
];

interface BookingSearchFormProps {
	onSearch: () => void;
	isSearching: boolean;
}

const BookingSearchForm: React.FC<BookingSearchFormProps> = ({
	onSearch,
	isSearching,
}) => {
	const dispatch = useDispatch();
	const { checkIn, checkOut, zone, quality } = useSelector(
		(state: RootState) => state.booking
	);

	const isValid = checkIn && checkOut && checkIn < checkOut && zone;

	const getAvailableQualities = () => {
		if (!zone) return qualities;
		if (zone === "women-only") return qualities;
		return qualities.filter((q) => !q.womenOnly);
	};

	const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newZone = e.target.value as PodFloor;
		dispatch(setZone(newZone));
		// Reset quality if zone changes and quality is not compatible
		if (newZone !== "women-only" && quality === "matcha") {
			dispatch(setQuality(""));
		}
	};

	return (
		<div className="booking-search-form">
			<div className="booking-search-form__fields">
				{/* Check In */}
				<div className="booking-search-form__field">
					<label className="booking-search-form__label">
						Check In <span className="booking-search-form__required">*</span>
					</label>
					<div className="booking-search-form__input-wrapper">
						<Calendar
							size={18}
							className="booking-search-form__icon"
						/>
						<input
							type="date"
							value={checkIn}
							onChange={(e) => dispatch(setCheckIn(e.target.value))}
							min={new Date().toISOString().split("T")[0]}
							className="booking-search-form__input"
						/>
					</div>
				</div>

				{/* Check Out */}
				<div className="booking-search-form__field">
					<label className="booking-search-form__label">
						Check Out <span className="booking-search-form__required">*</span>
					</label>
					<div className="booking-search-form__input-wrapper">
						<Calendar
							size={18}
							className="booking-search-form__icon"
						/>
						<input
							type="date"
							value={checkOut}
							onChange={(e) => dispatch(setCheckOut(e.target.value))}
							min={checkIn || new Date().toISOString().split("T")[0]}
							className="booking-search-form__input"
						/>
					</div>
				</div>

				{/* Zone Selection */}
				<div className="booking-search-form__field">
					<label className="booking-search-form__label">
						Floor Type <span className="booking-search-form__required">*</span>
					</label>
					<div className="booking-search-form__input-wrapper">
						<Building
							size={18}
							className="booking-search-form__icon"
						/>
						<select
							value={zone}
							onChange={handleZoneChange}
							className="booking-search-form__input booking-search-form__select"
						>
							<option value="">Select floor type</option>
							{zones.map((z) => (
								<option key={z.value} value={z.value}>
									{z.icon} {z.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Quality Selection (Optional) */}
				<div className="booking-search-form__field">
					<label className="booking-search-form__label">
						Quality Level{" "}
						<span className="booking-search-form__optional">(Optional)</span>
					</label>
					<div className="booking-search-form__input-wrapper">
						<Sparkles
							size={18}
							className="booking-search-form__icon"
						/>
						<select
							value={quality}
							onChange={(e) =>
								dispatch(setQuality(e.target.value as PodQuality))
							}
							disabled={!zone}
							className="booking-search-form__input booking-search-form__select"
						>
							<option value="">All quality levels</option>
							{getAvailableQualities().map((q) => (
								<option key={q.value} value={q.value}>
									{q.label} - ${q.price}/night - {q.desc}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			<button
				onClick={onSearch}
				disabled={!isValid || isSearching}
				className="booking-search-form__button"
			>
				{isSearching ? "Searching..." : "Search Available Pods"}
			</button>
		</div>
	);
};

export default BookingSearchForm;

