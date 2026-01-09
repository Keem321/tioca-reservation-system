import { useState } from "react";
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
import type { ReservationFormData, Reservation } from "../types/reservation";
import type { Room } from "../types/room";
import "./ReservationManagement.css";

/**
 * ReservationManagement - Manager page for CRUD operations on reservations
 *
 * Features:
 * - View all reservations
 * - Create new reservations
 * - Update existing reservations
 * - Cancel reservations
 * - Check in/check out guests
 * - Update reservation status
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

	// Apply local sorting
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

	// Mutations
	const [createReservation, { isLoading: isCreating }] =
		useCreateReservationMutation();
	const [updateReservation, { isLoading: isUpdating }] =
		useUpdateReservationMutation();
	const [deleteReservation] = useDeleteReservationMutation();
	const [cancelReservation] = useCancelReservationMutation();
	const [checkIn] = useCheckInMutation();
	const [checkOut] = useCheckOutMutation();

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value } = e.target;
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
		try {
			if (editingReservation) {
				await updateReservation({
					id: editingReservation,
					data: formData,
				}).unwrap();
				alert("Reservation updated successfully!");
			} else {
				await createReservation(formData).unwrap();
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
			userId:
				typeof reservation.userId === "string"
					? reservation.userId
					: reservation.userId._id,
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
												Pod {room.podId} - {room.quality} ({room.floor}) ($
												{room.pricePerNight}/night)
											</option>
										))}
									</select>
								</label>

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
									/>
								</label>

								<label>
									Check-In Date:
									<input
										type="date"
										name="checkInDate"
										value={formData.checkInDate}
										onChange={handleInputChange}
										required
									/>
								</label>

								<label>
									Check-Out Date:
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
										onChange={handleInputChange}
										min="1"
										required
									/>
								</label>

								<label>
									Total Price ($):
									<input
										type="number"
										name="totalPrice"
										value={formData.totalPrice}
										onChange={handleInputChange}
										min="0"
										step="0.01"
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
							</div>

							<label>
								Special Requests:
								<textarea
									name="specialRequests"
									value={formData.specialRequests}
									onChange={handleInputChange}
									rows={3}
								/>
							</label>

							<div className="form-actions">
								<button type="submit" disabled={isCreating || isUpdating}>
									{isCreating || isUpdating
										? "Saving..."
										: editingReservation
										? "Update Reservation"
										: "Create Reservation"}
								</button>
								<button type="button" onClick={resetForm}>
									Cancel
								</button>
							</div>
						</form>
					</div>
				)}

				{/* Reservation List */}
				<div className="reservation-list">
					<h2>Reservations</h2>
					{isLoading && <p>Loading reservations...</p>}
					{error && <p className="error">Error loading reservations</p>}

					{!isLoading && reservations.length === 0 && (
						<p>No reservations found. Create one to get started!</p>
					)}

					{reservations.length > 0 && (
						<>
							{/* Bulk Actions */}
							{selectedReservations.size > 0 && (
								<div className="bulk-actions">
									<span className="bulk-info">
										{selectedReservations.size} selected
									</span>
									<button
										className="btn-bulk-checkin"
										onClick={bulkCheckIn}
										title="Check in all selected reservations"
									>
										Bulk Check In
									</button>
									<button
										className="btn-bulk-checkout"
										onClick={bulkCheckOut}
										title="Check out all selected reservations"
									>
										Bulk Check Out
									</button>
									<button
										className="btn-clear-selection"
										onClick={() => setSelectedReservations(new Set())}
									>
										Clear Selection
									</button>
								</div>
							)}

							<table>
								<thead>
									<tr>
										<th>
											<input
												type="checkbox"
												checked={
													selectedReservations.size === reservations.length &&
													reservations.length > 0
												}
												onChange={(e) => toggleSelectAll(e.target.checked)}
												title="Select all"
											/>
										</th>
										<th>Guest</th>
										<th>Room</th>
										<th>Check-In</th>
										<th>Check-Out</th>
										<th>Guests</th>
										<th>Total</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{reservations.map((reservation: Reservation) => (
										<tr key={reservation._id}>
											<td>
												<input
													type="checkbox"
													checked={selectedReservations.has(reservation._id)}
													onChange={() =>
														toggleSelectReservation(reservation._id)
													}
												/>
											</td>
											<td>
												<div>{reservation.guestName}</div>
												<div className="email">{reservation.guestEmail}</div>
											</td>

											<td>
												{typeof reservation.roomId === "string"
													? reservation.roomId
													: reservation.roomId?.podId
													? `Pod ${reservation.roomId.podId} (${reservation.roomId.quality})`
													: "N/A"}
											</td>
											<td>
												{new Date(reservation.checkInDate).toLocaleDateString()}
											</td>
											<td>
												{new Date(
													reservation.checkOutDate
												).toLocaleDateString()}
											</td>
											<td>{reservation.numberOfGuests}</td>
											<td>${reservation.totalPrice}</td>
											<td>
												<span
													className={`status-badge status-${reservation.status}`}
												>
													{reservation.status}
												</span>
											</td>
											<td className="actions">
												<button
													onClick={() => handleEdit(reservation)}
													className="btn-edit"
												>
													Edit
												</button>
												{reservation.status === "confirmed" && (
													<button
														onClick={() => handleCheckIn(reservation._id)}
														className="btn-checkin"
													>
														Check In
													</button>
												)}
												{reservation.status === "checked-in" && (
													<button
														onClick={() => handleCheckOut(reservation._id)}
														className="btn-checkout"
													>
														Check Out
													</button>
												)}
												{!["cancelled", "checked-out"].includes(
													reservation.status
												) && (
													<button
														onClick={() => handleCancel(reservation._id)}
														className="btn-cancel"
													>
														Cancel
													</button>
												)}
												<button
													onClick={() => handleDelete(reservation._id)}
													className="btn-delete"
												>
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</>
					)}
				</div>
			</div>
		</>
	);
}
