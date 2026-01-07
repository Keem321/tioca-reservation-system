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
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [showForm, setShowForm] = useState(false);
	const [editingReservation, setEditingReservation] = useState<string | null>(
		null
	);
	const [formData, setFormData] = useState<ReservationFormData>({
		roomId: "",
		userId: "000000000000000000000000", // Placeholder - in real app, would come from auth
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

	// Fetch data
	const { data: rooms = [] } = useGetRoomsQuery(undefined);

	const {
		data: allReservations = [],
		isLoading,
		error,
	} = useGetReservationsQuery();

	const reservations = statusFilter
		? (allReservations as Reservation[]).filter(
				(r) => r.status === statusFilter
		  )
		: (allReservations as Reservation[]) || [];

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

	const resetForm = () => {
		setFormData({
			roomId: "",
			userId: "000000000000000000000000",
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

				{/* Filters */}
				<div className="filters">
					<label>
						Filter by Status:
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
					<button onClick={() => setShowForm(!showForm)}>
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
						<table>
							<thead>
								<tr>
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
											{new Date(reservation.checkOutDate).toLocaleDateString()}
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
					)}
				</div>
			</div>{" "}
		</>
	);
}
