import { useMemo, useState } from "react";
import Navbar from "../components/landing/Navbar";
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
import { formatMoney, formatPricePerNight } from "../utils/money";
import type { ReservationFormData, Reservation } from "../types/reservation";
import type { Room } from "../types/room";
import "./ReservationManagement.css";

/**
 * ReservationManagement - Manager page for CRUD operations on reservations
 */
export default function ReservationManagement() {
	// Filters
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [dateFromFilter, setDateFromFilter] = useState<string>("");
	const [dateToFilter, setDateToFilter] = useState<string>("");
	const [guestEmailFilter, setGuestEmailFilter] = useState<string>("");
	const [podIdFilter, setPodIdFilter] = useState<string>("");

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

	// Display currency (manager view stays in USD for now)
	const displayCurrency = "USD";

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
	const reservations = [...(allReservations as Reservation[])].sort((a, b) => {
		let compareValue = 0;
		switch (sortBy) {
			case "date":
				compareValue =
					new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
				break;
			case "status":
				compareValue = a.status.localeCompare(b.status);
				break;
			case "guest":
				compareValue = a.guestName.localeCompare(b.guestName);
				break;
		}
		return sortOrder === "asc" ? compareValue : -compareValue;
	});

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
					: reservation.roomId._id,
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
				<div className="filters">
					<div className="filters__header">
						<h3>Search & Filter</h3>
						<button
							className="filters__clear"
							onClick={() => {
								setStatusFilter("");
								setDateFromFilter("");
								setDateToFilter("");
								setGuestEmailFilter("");
								setPodIdFilter("");
							}}
						>
							Clear All Filters
						</button>
					</div>
					<div className="filters__grid">
						<label>
							Status:
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
							>
								<option value="">All Statuses</option>
								<option value="pending">Pending</option>
								<option value="confirmed">Confirmed</option>
								<option value="checked-in">Checked In</option>
								<option value="checked-out">Checked Out</option>
								<option value="cancelled">Cancelled</option>
							</select>
						</label>
						<label>
							Check-in From:
							<input
								type="date"
								value={dateFromFilter}
								onChange={(e) => setDateFromFilter(e.target.value)}
							/>
						</label>
						<label>
							Check-in To:
							<input
								type="date"
								value={dateToFilter}
								onChange={(e) => setDateToFilter(e.target.value)}
							/>
						</label>
						<label>
							Guest Email:
							<input
								type="email"
								value={guestEmailFilter}
								onChange={(e) => setGuestEmailFilter(e.target.value)}
								placeholder="Search email..."
							/>
						</label>
						<label>
							Pod ID:
							<input
								type="text"
								value={podIdFilter}
								onChange={(e) => setPodIdFilter(e.target.value)}
								placeholder="e.g., A101"
							/>
						</label>
						<label>
							Sort By:
							<div style={{ display: "flex", gap: "0.5rem" }}>
								<select
									value={sortBy}
									onChange={(e) =>
										setSortBy(e.target.value as "date" | "status" | "guest")
									}
								>
									<option value="date">Check-in Date</option>
									<option value="status">Status</option>
									<option value="guest">Guest Name</option>
								</select>
								<button
									onClick={() =>
										setSortOrder(sortOrder === "asc" ? "desc" : "asc")
									}
									title={`Sort ${
										sortOrder === "asc" ? "descending" : "ascending"
									}`}
									style={{ padding: "0.5rem 1rem" }}
								>
									{sortOrder === "asc" ? "↑" : "↓"}
								</button>
							</div>
						</label>
					</div>
				</div>

				{/* Results Count */}
				<div className="results-info">
					<p>Showing {reservations.length} reservation(s)</p>
					<button
						onClick={() => setShowForm(!showForm)}
						className="btn-primary"
					>
						{showForm ? "Cancel" : "Add New Reservation"}
					</button>
				</div>

				{/* Form */}
				{showForm && (
					<div className="reservation-form">
						<h2>
							{editingReservation
								? "Edit Reservation"
								: "Create New Reservation"}
						</h2>
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
												Pod {room.podId} - {room.quality} ({room.floor})
												{room.offering?.basePrice
													? ` • ${formatPricePerNight(
															room.offering.basePrice,
															displayCurrency
													  )}`
													: ""}
											</option>
										))}
									</select>
								</label>

								{selectedRoomOffering && (
									<div className="price-hint">
										Base rate:{" "}
										{formatPricePerNight(
											selectedRoomOffering.basePrice,
											displayCurrency
										)}
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
												<div className="amenity-item__name">{amenity.name}</div>
												<div className="amenity-item__price">
													{formatMoney(amenity.basePrice, displayCurrency)}
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
									{formatPricePerNight(pricing.basePerNight, displayCurrency)}
									{nights > 0 && <span> × {nights} night(s)</span>}
								</div>
								<div>
									<strong>Amenities:</strong>{" "}
									{formatMoney(pricing.amenitiesTotal, displayCurrency)}
								</div>
								<div className="price-summary__total">
									<strong>Total:</strong>{" "}
									{formatMoney(pricing.total, displayCurrency)}
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
				)}

				{/* Bulk actions */}
				<div className="bulk-actions">
					<div className="bulk-actions__left">
						<label>
							<input
								type="checkbox"
								onChange={(e) => toggleSelectAll(e.target.checked)}
								checked={
									selectedReservations.size > 0 &&
									selectedReservations.size === reservations.length
								}
							/>
							Select All
						</label>
						<span>{selectedReservations.size} selected</span>
					</div>
					<div className="bulk-actions__right">
						<button
							onClick={bulkCheckIn}
							disabled={selectedReservations.size === 0}
						>
							Bulk Check-in
						</button>
						<button
							onClick={bulkCheckOut}
							disabled={selectedReservations.size === 0}
						>
							Bulk Check-out
						</button>
					</div>
				</div>

				{/* Reservations List */}
				<div className="reservation-list">
					<h2>Reservations</h2>
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
										<th></th>
										<th>Guest</th>
										<th>Room</th>
										<th>Dates</th>
										<th>Status</th>
										<th>Payment</th>
										<th>Total</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{reservations.map((reservation) => {
										const roomDisplay =
											typeof reservation.roomId === "string"
												? reservation.roomId
												: `Pod ${reservation.roomId.podId} (${reservation.roomId.quality})`;
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
												<td>
													{formatMoney(reservation.totalPrice, displayCurrency)}
												</td>
												<td className="actions">
													<button onClick={() => handleEdit(reservation)}>
														Edit
													</button>
													<button onClick={() => handleDelete(reservation._id)}>
														Delete
													</button>
													{reservation.status !== "cancelled" && (
														<button
															onClick={() => handleCancel(reservation._id)}
														>
															Cancel
														</button>
													)}
													{canCheckIn && (
														<button
															onClick={() => handleCheckIn(reservation._id)}
														>
															Check-in
														</button>
													)}
													{canCheckOut && (
														<button
															onClick={() => handleCheckOut(reservation._id)}
														>
															Check-out
														</button>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
