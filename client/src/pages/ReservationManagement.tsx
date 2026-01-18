import { useMemo, useState } from "react";
import React from "react";
import Navbar from "../components/landing/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
	Calendar,
	Mail,
	Search,
	SlidersHorizontal,
	Plus,
	X,
	MoreVertical,
} from "lucide-react";
import Pagination from "../components/Pagination";
import {
	useGetReservationsQuery,
	useCreateReservationMutation,
	useUpdateReservationMutation,
	useDeleteReservationMutation,
	useCancelReservationMutation,
	useCheckInMutation,
	useCheckOutMutation,
} from "../features/reservationsApi";
import { useGetRoomsQuery } from "../features/roomsApi";
import {
	useGetAmenityOfferingsQuery,
	useGetRoomOfferingsQuery,
} from "../features/offeringsApi";
import { useFormatMoney } from "../hooks/useFormatMoney";
import type { ReservationFormData, Reservation } from "../types/reservation";
import type { Room } from "../types/room";
import "./ReservationManagement.css";

/**
 * ReservationManagement - Manager page for CRUD operations on reservations
 */
export default function ReservationManagement() {
	const { formatMoney, formatPricePerNight } = useFormatMoney();
	// Filters
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [dateFromFilter, setDateFromFilter] = useState<string>("");
	const [dateToFilter, setDateToFilter] = useState<string>("");
	const [guestEmailFilter, setGuestEmailFilter] = useState<string>("");
	const [podIdFilter, setPodIdFilter] = useState<string>("");

	// Calculate active filter count
	const activeFilterCount = [
		statusFilter,
		dateFromFilter,
		dateToFilter,
		guestEmailFilter,
		podIdFilter,
	].filter(Boolean).length;

	// UI state
	const [showForm, setShowForm] = useState(false);
	const [editingReservation, setEditingReservation] = useState<string | null>(
		null
	);
	const [sortBy, setSortBy] = useState<"date" | "status" | "guest">("date");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [selectedReservations, setSelectedReservations] = useState<Set<string>>(
		new Set()
	);
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	const [formData, setFormData] = useState<ReservationFormData>({
		roomId: "",
		offeringId: "",
		selectedAmenities: [],
		userId: undefined,
		guestName: "",
		guestEmail: "",
		guestPhone: "",
		checkInDate: "",
		checkOutDate: "",
		numberOfGuests: 1,
		totalPrice: 0,
		status: "pending",
		paymentStatus: "unpaid",
		specialRequests: "",
	});

	// Fetch data with filters
	const { data: rooms = [] } = useGetRoomsQuery(undefined);

	const {
		data: allReservations = [],
		isLoading,
		error,
	} = useGetReservationsQuery({
		status: statusFilter,
		dateFrom: dateFromFilter,
		dateTo: dateToFilter,
		guestEmail: guestEmailFilter,
		podId: podIdFilter,
	});

	// Mutations
	const [createReservation, { isLoading: isCreating }] =
		useCreateReservationMutation();
	const [updateReservation, { isLoading: isUpdating }] =
		useUpdateReservationMutation();
	const [deleteReservation] = useDeleteReservationMutation();
	const [cancelReservation] = useCancelReservationMutation();
	const [checkIn] = useCheckInMutation();
	const [checkOut] = useCheckOutMutation();

	// Offerings
	const { data: roomOfferings = [] } = useGetRoomOfferingsQuery({});
	const { data: amenityOfferings = [] } = useGetAmenityOfferingsQuery({});

	// Derived selections
	const selectedRoom = useMemo(
		() => rooms.find((r) => r._id === formData.roomId),
		[rooms, formData.roomId]
	);

	const effectiveOfferingId = selectedRoom?.offeringId || formData.offeringId;
	const selectedRoomOffering = useMemo(
		() => roomOfferings.find((o) => o._id === effectiveOfferingId),
		[roomOfferings, effectiveOfferingId]
	);

	const nights = useMemo(() => {
		if (!formData.checkInDate || !formData.checkOutDate) return 0;
		const start = new Date(formData.checkInDate);
		const end = new Date(formData.checkOutDate);
		const diff = end.getTime() - start.getTime();
		return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
	}, [formData.checkInDate, formData.checkOutDate]);

	const pricing = useMemo(() => {
		const basePerNight = selectedRoomOffering?.basePrice || 0;
		const baseTotal = nights > 0 ? basePerNight * nights : 0;
		const amenitiesTotal = formData.selectedAmenities.reduce((total, id) => {
			const amenity = amenityOfferings.find((a) => a._id === id);
			if (!amenity) return total;
			if (amenity.priceType === "per-night") {
				return total + amenity.basePrice * Math.max(nights, 1);
			}
			return total + amenity.basePrice;
		}, 0);

		return {
			basePerNight,
			amenitiesTotal,
			total: baseTotal + amenitiesTotal,
		};
	}, [
		amenityOfferings,
		formData.selectedAmenities,
		nights,
		selectedRoomOffering,
	]);

	// Sorting
	const sortedReservations = [...(allReservations as Reservation[])].sort(
		(a, b) => {
			let compareValue = 0;
			switch (sortBy) {
				case "date":
					compareValue =
						new Date(a.checkInDate).getTime() -
						new Date(b.checkInDate).getTime();
					break;
				case "status":
					compareValue = a.status.localeCompare(b.status);
					break;
				case "guest":
					compareValue = a.guestName.localeCompare(b.guestName);
					break;
			}
			return sortOrder === "asc" ? compareValue : -compareValue;
		}
	);

	// Pagination
	const totalPages = Math.ceil(sortedReservations.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const reservations = sortedReservations.slice(startIndex, endIndex);

	// Reset to page 1 when filters change
	React.useEffect(() => {
		setCurrentPage(1);
	}, [
		statusFilter,
		dateFromFilter,
		dateToFilter,
		guestEmailFilter,
		podIdFilter,
	]);

	// Handle ESC key to close modal
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && showForm) {
				setShowForm(false);
			}
		};

		if (showForm) {
			document.addEventListener("keydown", handleEscape);
			// Prevent body scroll when modal is open
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [showForm]);

	// Close dropdown when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (openDropdownId && !target.closest('.actions-dropdown')) {
				setOpenDropdownId(null);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [openDropdownId]);

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value } = e.target;

		if (name === "selectedAmenities") {
			const target = e.target as HTMLInputElement;
			const amenityId = target.value;
			setFormData((prev) => {
				const next = new Set(prev.selectedAmenities);
				if (next.has(amenityId)) {
					next.delete(amenityId);
				} else {
					next.add(amenityId);
				}
				return { ...prev, selectedAmenities: Array.from(next) };
			});
			return;
		}

		if (name === "roomId") {
			const room = rooms.find((r) => r._id === value);
			setFormData((prev) => ({
				...prev,
				roomId: value,
				offeringId: room?.offeringId || "",
			}));
			return;
		}

		setFormData((prev) => ({
			...prev,
			[name]:
				name === "numberOfGuests" || name === "totalPrice"
					? Number(value)
					: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (nights <= 0) {
			alert("Check-out date must be after check-in date");
			return;
		}

		if (selectedRoom && formData.numberOfGuests > selectedRoom.capacity) {
			alert(
				`Number of guests exceeds room capacity (${selectedRoom.capacity})`
			);
			return;
		}

		const payload: ReservationFormData = {
			...formData,
			offeringId: effectiveOfferingId || formData.offeringId,
			totalPrice: pricing.total,
		};

		try {
			if (editingReservation) {
				await updateReservation({
					id: editingReservation,
					data: payload,
				}).unwrap();
				alert("Reservation updated successfully!");
			} else {
				await createReservation(payload).unwrap();
				alert("Reservation created successfully!");
			}
			resetForm();
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to save reservation"}`);
		}
	};

	const handleEdit = (reservation: Reservation) => {
		setEditingReservation(reservation._id);
		setFormData({
			roomId:
				typeof reservation.roomId === "string"
					? reservation.roomId
					: reservation.roomId?._id || "",
			offeringId: reservation.offeringId || "",
			selectedAmenities:
				reservation.selectedAmenities?.map((a) => a.offeringId) || [],
			userId:
				typeof reservation.userId === "string"
					? reservation.userId
					: reservation.userId?._id || "",
			guestName: reservation.guestName,
			guestEmail: reservation.guestEmail,
			guestPhone: reservation.guestPhone || "",
			checkInDate: reservation.checkInDate.split("T")[0],
			checkOutDate: reservation.checkOutDate.split("T")[0],
			numberOfGuests: reservation.numberOfGuests,
			totalPrice: reservation.totalPrice,
			status: reservation.status,
			paymentStatus: reservation.paymentStatus,
			specialRequests: reservation.specialRequests || "",
		});
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (window.confirm("Are you sure you want to delete this reservation?")) {
			try {
				await deleteReservation(id).unwrap();
				alert("Reservation deleted successfully!");
			} catch (err) {
				const error = err as { data?: { error?: string } };
				alert(`Error: ${error?.data?.error || "Failed to delete reservation"}`);
			}
		}
	};

	const handleCancel = async (id: string) => {
		const reason = prompt("Enter cancellation reason (optional):");
		try {
			await cancelReservation({ id, reason: reason || "" }).unwrap();
			alert("Reservation cancelled successfully!");
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to cancel reservation"}`);
		}
	};

	const handleCheckIn = async (id: string) => {
		try {
			await checkIn(id).unwrap();
			alert("Guest checked in successfully!");
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to check in"}`);
		}
	};

	const handleCheckOut = async (id: string) => {
		try {
			await checkOut(id).unwrap();
			alert("Guest checked out successfully!");
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to check out"}`);
		}
	};

	const toggleSelectReservation = (id: string) => {
		const newSelected = new Set(selectedReservations);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedReservations(newSelected);
	};

	const toggleSelectAll = (selectAll: boolean) => {
		if (selectAll) {
			const allIds = new Set(reservations.map((r) => r._id));
			setSelectedReservations(allIds);
		} else {
			setSelectedReservations(new Set());
		}
	};

	const bulkCheckIn = async () => {
		if (selectedReservations.size === 0) {
			alert("Please select at least one reservation");
			return;
		}
		for (const id of selectedReservations) {
			try {
				await checkIn(id).unwrap();
			} catch (err) {
				console.error("Failed to check in reservation", id, err);
			}
		}
		setSelectedReservations(new Set());
		alert(`Checked in ${selectedReservations.size} reservation(s)`);
	};

	const bulkCheckOut = async () => {
		if (selectedReservations.size === 0) {
			alert("Please select at least one reservation");
			return;
		}
		for (const id of selectedReservations) {
			try {
				await checkOut(id).unwrap();
			} catch (err) {
				console.error("Failed to check out reservation", id, err);
			}
		}
		setSelectedReservations(new Set());
		alert(`Checked out ${selectedReservations.size} reservation(s)`);
	};

	const resetForm = () => {
		setFormData({
			roomId: "",
			offeringId: "",
			selectedAmenities: [],
			userId: undefined,
			guestName: "",
			guestEmail: "",
			guestPhone: "",
			checkInDate: "",
			checkOutDate: "",
			numberOfGuests: 1,
			totalPrice: 0,
			status: "pending",
			paymentStatus: "unpaid",
			specialRequests: "",
		});
		setEditingReservation(null);
		setShowForm(false);
	};

	const getAvailableRooms = () => rooms as Room[];

	return (
		<>
			<Navbar />
			<div className="reservation-management">
				<h1>Reservation Management</h1>

				{/* Advanced Filters */}
				<div
					className={`filters ${
						activeFilterCount > 0 ? "filters--active" : ""
					}`}
				>
					<div className="filters__header">
						<div className="filters__header-content">
							<Search size={32} className="filters__icon filters__icon--main" />
							{activeFilterCount > 0 && (
								<span className="filters__badge">
									{activeFilterCount}{" "}
									{activeFilterCount === 1 ? "filter" : "filters"} active
								</span>
							)}
						</div>
						<button
							className="filters__clear"
							onClick={() => {
								setStatusFilter("");
								setDateFromFilter("");
								setDateToFilter("");
								setGuestEmailFilter("");
								setPodIdFilter("");
							}}
							disabled={activeFilterCount === 0}
						>
							Clear All Filters
						</button>
					</div>

					<div className="filters__content">
						<div className="filter-group">
							<label className="filter-label">
								<span className="filter-label-text">Status</span>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className={`filter-input ${
										statusFilter ? "filter-input--active" : ""
									}`}
								>
									<option value="">All Statuses</option>
									<option value="pending">Pending</option>
									<option value="confirmed">Confirmed</option>
									<option value="checked-in">Checked In</option>
									<option value="checked-out">Checked Out</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</label>
						</div>

						<div className="filter-group">
							<label className="filter-label">
								<span className="filter-label-text">
									<Mail size={14} /> Guest Email
								</span>
								<input
									type="email"
									value={guestEmailFilter}
									onChange={(e) => setGuestEmailFilter(e.target.value)}
									placeholder="Search by email..."
									className={`filter-input ${
										guestEmailFilter ? "filter-input--active" : ""
									}`}
								/>
							</label>
						</div>

						<div className="filter-group">
							<label className="filter-label">
								<span className="filter-label-text">
									<Search size={14} /> Pod ID
								</span>
								<input
									type="text"
									value={podIdFilter}
									onChange={(e) => setPodIdFilter(e.target.value)}
									placeholder="e.g., A101"
									className={`filter-input ${
										podIdFilter ? "filter-input--active" : ""
									}`}
								/>
							</label>
						</div>

						<div className="filter-group">
							<label className="filter-label">
								<span className="filter-label-text">
									<Calendar size={14} /> Check-in From
								</span>
								<DatePicker
									selected={dateFromFilter ? new Date(dateFromFilter) : null}
									onChange={(date) =>
										setDateFromFilter(
											date ? date.toISOString().split("T")[0] : ""
										)
									}
									dateFormat="MMM d, yyyy"
									className={`filter-input ${
										dateFromFilter ? "filter-input--active" : ""
									}`}
									placeholderText="From date"
									isClearable
								/>
							</label>
						</div>

						<div className="filter-group">
							<label className="filter-label">
								<span className="filter-label-text">
									<Calendar size={14} /> Check-in To
								</span>
								<DatePicker
									selected={dateToFilter ? new Date(dateToFilter) : null}
									onChange={(date) =>
										setDateToFilter(
											date ? date.toISOString().split("T")[0] : ""
										)
									}
									minDate={
										dateFromFilter ? new Date(dateFromFilter) : undefined
									}
									dateFormat="MMM d, yyyy"
									className={`filter-input ${
										dateToFilter ? "filter-input--active" : ""
									}`}
									placeholderText="To date"
									isClearable
								/>
							</label>
						</div>

						<div className="filter-group filter-group--sort">
							<label className="filter-label">
								<span className="filter-label-text">Sort By</span>
								<div className="sort-controls">
									<select
										value={sortBy}
										onChange={(e) =>
											setSortBy(e.target.value as "date" | "status" | "guest")
										}
										className="filter-input"
									>
										<option value="date">Check-in Date</option>
										<option value="status">Status</option>
										<option value="guest">Guest Name</option>
									</select>
									<button
										className="sort-toggle"
										onClick={() =>
											setSortOrder(sortOrder === "asc" ? "desc" : "asc")
										}
										title={`Sort ${
											sortOrder === "asc" ? "descending" : "ascending"
										}`}
									>
										{sortOrder === "asc" ? "↑" : "↓"}
									</button>
								</div>
							</label>
						</div>
					</div>
				</div>

				{/* Form Modal */}
				{showForm && (
					<>
						<div
							className="modal-overlay"
							onClick={() => setShowForm(false)}
						></div>
						<div className="modal" onClick={(e) => e.stopPropagation()}>
							<div className="modal__header">
								<h2>
									{editingReservation
										? "Edit Reservation"
										: "Create New Reservation"}
								</h2>
								<button
									type="button"
									className="modal__close"
									onClick={() => setShowForm(false)}
									aria-label="Close modal"
								>
									<X size={24} />
								</button>
							</div>
							<form onSubmit={handleSubmit}>
								<div className="form-grid">
									<label>
										Room:
										<select
											name="roomId"
											value={formData.roomId}
											onChange={handleInputChange}
											required
										>
											<option value="">Select Room</option>
											{getAvailableRooms().map((room: Room) => (
												<option key={room._id} value={room._id}>
													{room.podId ? `Pod ${room.podId}` : "Room"} -{" "}
													{room.quality} ({room.floor})
													{room.offering?.basePrice
														? ` • ${formatPricePerNight(
																room.offering.basePrice
														  )}`
														: ""}
												</option>
											))}
										</select>
									</label>

									{selectedRoomOffering && (
										<div className="price-hint">
											Base rate:{" "}
											{formatPricePerNight(selectedRoomOffering.basePrice)}
											{nights > 0 && <span> × {nights} night(s)</span>}
										</div>
									)}

									<label>
										Guest Name:
										<input
											type="text"
											name="guestName"
											value={formData.guestName}
											onChange={handleInputChange}
											required
										/>
									</label>

									<label>
										Guest Email:
										<input
											type="email"
											name="guestEmail"
											value={formData.guestEmail}
											onChange={handleInputChange}
											required
										/>
									</label>

									<label>
										Guest Phone:
										<input
											type="tel"
											name="guestPhone"
											value={formData.guestPhone}
											onChange={handleInputChange}
											placeholder="Optional"
										/>
									</label>

									<label>
										Check-in Date:
										<input
											type="date"
											name="checkInDate"
											value={formData.checkInDate}
											onChange={handleInputChange}
											required
										/>
									</label>

									<label>
										Check-out Date:
										<input
											type="date"
											name="checkOutDate"
											value={formData.checkOutDate}
											onChange={handleInputChange}
											required
										/>
									</label>

									<label>
										Number of Guests:
										<input
											type="number"
											name="numberOfGuests"
											value={formData.numberOfGuests}
											min={1}
											onChange={handleInputChange}
											required
										/>
									</label>

									<label>
										Status:
										<select
											name="status"
											value={formData.status}
											onChange={handleInputChange}
										>
											<option value="pending">Pending</option>
											<option value="confirmed">Confirmed</option>
											<option value="checked-in">Checked In</option>
											<option value="checked-out">Checked Out</option>
											<option value="cancelled">Cancelled</option>
										</select>
									</label>

									<label>
										Payment Status:
										<select
											name="paymentStatus"
											value={formData.paymentStatus}
											onChange={handleInputChange}
										>
											<option value="unpaid">Unpaid</option>
											<option value="partial">Partial</option>
											<option value="paid">Paid</option>
											<option value="refunded">Refunded</option>
										</select>
									</label>

									<label className="full-width">
										Special Requests:
										<textarea
											name="specialRequests"
											value={formData.specialRequests}
											onChange={handleInputChange}
											rows={2}
											placeholder="Any special notes for the stay"
										/>
									</label>
								</div>

								<div className="amenities">
									<h4>Add Amenities</h4>
									<div className="amenities__list">
										{amenityOfferings.map((amenity) => (
											<label key={amenity._id} className="amenity-item">
												<input
													type="checkbox"
													name="selectedAmenities"
													value={amenity._id}
													checked={formData.selectedAmenities.includes(
														amenity._id
													)}
													onChange={handleInputChange}
												/>
												<div>
													<div className="amenity-item__name">
														{amenity.name}
													</div>
													<div className="amenity-item__price">
														{formatMoney(amenity.basePrice)}
														{amenity.priceType === "per-night"
															? " per night"
															: " flat"}
													</div>
												</div>
											</label>
										))}
										{amenityOfferings.length === 0 && (
											<p className="muted">No amenities configured.</p>
										)}
									</div>
								</div>

								<div className="price-summary">
									<div>
										<strong>Base rate:</strong>{" "}
										{formatPricePerNight(pricing.basePerNight)}
										{nights > 0 && <span> × {nights} night(s)</span>}
									</div>
									<div>
										<strong>Amenities:</strong>{" "}
										{formatMoney(pricing.amenitiesTotal)}
									</div>
									<div className="price-summary__total">
										<strong>Total:</strong> {formatMoney(pricing.total)}
									</div>
								</div>

								<div className="form-actions">
									<button
										type="submit"
										className="btn-primary"
										disabled={isCreating || isUpdating}
									>
										{editingReservation ? "Update" : "Create"} Reservation
									</button>
									<button type="button" onClick={resetForm}>
										Reset
									</button>
								</div>
							</form>
						</div>
					</>
				)}

				{/* Reservations List */}
				<div className="reservation-list">
					<div className="reservation-list__header">
						<div className="reservation-list__header-left">
							<h2>Reservations</h2>
							{reservations.length > 0 && selectedReservations.size > 0 && (
								<div className="bulk-actions-inline">
									<span className="selected-count">
										{selectedReservations.size} selected
									</span>
									<button
										onClick={bulkCheckIn}
										disabled={selectedReservations.size === 0}
										className="bulk-action-btn"
									>
										Bulk Check-in
									</button>
									<button
										onClick={bulkCheckOut}
										disabled={selectedReservations.size === 0}
										className="bulk-action-btn"
									>
										Bulk Check-out
									</button>
								</div>
							)}
						</div>
						<button
							onClick={() => setShowForm(!showForm)}
							className="btn-add-reservation"
							title={showForm ? "Cancel" : "Add New Reservation"}
						>
							<Plus />
						</button>
					</div>
					{isLoading && <p>Loading reservations...</p>}
					{error && <p className="error">Failed to load reservations.</p>}

					{!isLoading && reservations.length === 0 && (
						<p className="muted">No reservations found.</p>
					)}

					{!isLoading && reservations.length > 0 && (
						<div className="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>
											<input
												type="checkbox"
												onChange={(e) => toggleSelectAll(e.target.checked)}
												checked={
													selectedReservations.size > 0 &&
													selectedReservations.size === reservations.length
												}
												title="Select All"
											/>
										</th>
										<th>Guest</th>
										<th>Room</th>
										<th>Dates</th>
										<th>Status</th>
										<th>Payment</th>
										<th>Total</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{reservations.map((reservation) => {
										const roomDisplay =
											typeof reservation.roomId === "string"
												? reservation.roomId
												: reservation.roomId && reservation.roomId.podId
												? `Pod ${reservation.roomId.podId} (${reservation.roomId.quality})`
												: "Unknown Room";
										const isChecked = selectedReservations.has(reservation._id);
										const canCheckIn = reservation.status === "confirmed";
										const canCheckOut = reservation.status === "checked-in";

										return (
											<tr key={reservation._id}>
												<td>
													<input
														type="checkbox"
														checked={isChecked}
														onChange={() =>
															toggleSelectReservation(reservation._id)
														}
													/>
												</td>
												<td>
													<div className="guest-name">
														{reservation.guestName}
													</div>
													<div className="guest-email">
														{reservation.guestEmail}
													</div>
												</td>
												<td>{roomDisplay}</td>
												<td>
													<div>
														{new Date(
															reservation.checkInDate
														).toLocaleDateString()}{" "}
														-
														{new Date(
															reservation.checkOutDate
														).toLocaleDateString()}
													</div>
													<div className="muted">
														{reservation.numberOfGuests} guest(s)
													</div>
												</td>
												<td>
													<span
														className={`status status--${reservation.status}`}
													>
														{reservation.status}
													</span>
												</td>
												<td>
													<span
														className={`payment payment--${reservation.paymentStatus}`}
													>
														{reservation.paymentStatus}
													</span>
												</td>
												<td>{formatMoney(reservation.totalPrice)}</td>
												<td className="actions-cell">
													<div className="actions-dropdown">
														<button
															className="actions-dropdown__trigger"
															onClick={() =>
																setOpenDropdownId(
																	openDropdownId === reservation._id
																		? null
																		: reservation._id
																)
															}
															aria-label="Open actions menu"
														>
															<MoreVertical size={20} />
														</button>
														{openDropdownId === reservation._id && (
															<div className="actions-dropdown__menu">
																<button
																	onClick={() => {
																		handleEdit(reservation);
																		setOpenDropdownId(null);
																	}}
																	className="actions-dropdown__item"
																>
																	Edit
																</button>
																<button
																	onClick={() => {
																		handleDelete(reservation._id);
																		setOpenDropdownId(null);
																	}}
																	className="actions-dropdown__item actions-dropdown__item--delete"
																>
																	Delete
																</button>
																{reservation.status !== "cancelled" && (
																	<button
																		onClick={() => {
																			handleCancel(reservation._id);
																			setOpenDropdownId(null);
																		}}
																		className="actions-dropdown__item actions-dropdown__item--cancel"
																	>
																		Cancel
																	</button>
																)}
																{canCheckIn && (
																	<button
																		onClick={() => {
																			handleCheckIn(reservation._id);
																			setOpenDropdownId(null);
																		}}
																		className="actions-dropdown__item"
																	>
																		Check-in
																	</button>
																)}
																{canCheckOut && (
																	<button
																		onClick={() => {
																			handleCheckOut(reservation._id);
																			setOpenDropdownId(null);
																		}}
																		className="actions-dropdown__item"
																	>
																		Check-out
																	</button>
																)}
															</div>
														)}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}

					{/* Pagination */}
					{!isLoading && sortedReservations.length > 0 && (
						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							onPageChange={setCurrentPage}
							totalItems={sortedReservations.length}
							itemsPerPage={itemsPerPage}
							onItemsPerPageChange={setItemsPerPage}
						/>
					)}
				</div>
			</div>
		</>
	);
}
