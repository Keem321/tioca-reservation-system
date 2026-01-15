import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Building } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { setCheckIn, setCheckOut, setZone } from "../../features/bookingSlice";
import type { RootState } from "../../store";
import type { PodFloor } from "../../types/room";
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

interface BookingSearchFormProps {
	onSearch: () => void;
	isSearching: boolean;
	onValuesChange?: () => void;
}

const BookingSearchForm: React.FC<BookingSearchFormProps> = ({
	onSearch,
	isSearching,
	onValuesChange,
}) => {
	const dispatch = useDispatch();
	const { checkIn, checkOut, zone } = useSelector(
		(state: RootState) => state.booking
	);

	// Convert ISO strings to Date objects for DatePicker
	const checkInDate = checkIn ? new Date(checkIn) : null;
	const checkOutDate = checkOut ? new Date(checkOut) : null;

	const isValid = checkIn && checkOut && checkIn < checkOut && zone;

	const handleCheckInChange = (date: Date | null) => {
		if (date) {
			dispatch(setCheckIn(date.toISOString().split("T")[0]));
			onValuesChange?.();
		}
	};

	const handleCheckOutChange = (date: Date | null) => {
		if (date) {
			dispatch(setCheckOut(date.toISOString().split("T")[0]));
			onValuesChange?.();
		}
	};

	const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newZone = e.target.value as PodFloor;
		dispatch(setZone(newZone));
		onValuesChange?.();
	};

	return (
		<div className="booking-search-form">
			<div className="booking-search-form__fields">
				{/* Check In */}
				<div className="booking-search-form__field">
					<label className="booking-search-form__label">
						Check In <span className="booking-search-form__required">*</span>
					</label>
					<DatePicker
						selected={checkInDate}
						onChange={handleCheckInChange}
						minDate={new Date()}
						placeholderText="Select check-in"
						className="booking-search-form__input booking-search-form__datepicker"
					/>
				</div>

				{/* Check Out */}
				<div className="booking-search-form__field">
					<label className="booking-search-form__label">
						Check Out <span className="booking-search-form__required">*</span>
					</label>
					<DatePicker
						selected={checkOutDate}
						onChange={handleCheckOutChange}
						minDate={checkInDate || new Date()}
						placeholderText="Select check-out"
						className="booking-search-form__input booking-search-form__datepicker"
					/>
				</div>

				{/* Zone Selection */}
				<div className="booking-search-form__field">
					<label className="booking-search-form__label">
						Floor Type <span className="booking-search-form__required">*</span>
					</label>
					<div className="booking-search-form__input-wrapper">
						<Building size={18} className="booking-search-form__icon" />
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
