import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import Navbar from "../components/landing/Navbar";
import Pagination from "../components/Pagination";
import {
	useGetProfileQuery,
	useUpdateProfileMutation,
	useChangePasswordMutation,
	useGetActiveReservationsQuery,
} from "../features/userApi";
import {
	useModifyReservationMutation,
	useCancelReservationMutation,
} from "../features/reservationsApi";
import { useGetRoomsQuery } from "../features/roomsApi";
import { useFormatMoney } from "../hooks/useFormatMoney";
import { setCurrency } from "../features/currencySlice";
import type { Reservation } from "../types/reservation";
import "./Profile.css";

/**
 * Profile Page - User profile management and active reservations
 *
 * Features:
 * - View profile information (name, email)
 * - Edit profile (name, email, currency preference)
 * - Change password (for local strategy users)
 * - View active/upcoming reservations
 * - Currency preference syncs to Redux store for app-wide display formatting
 */
export default function Profile() {
	const dispatch = useDispatch();
	const { formatMoney } = useFormatMoney();

	const [isEditing, setIsEditing] = useState(false);
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [editFormData, setEditFormData] = useState<{
		name: string;
		email: string;
		currencyPreference: string;
	}>({ name: "", email: "", currencyPreference: "USD" });
	const [passwordFormData, setPasswordFormData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	// Get rooms data for capacity validation
	const { data: rooms = [] } = useGetRoomsQuery();

	// Reservation modification state
	const [editingReservation, setEditingReservation] =
		useState<Reservation | null>(null);
	const [reservationFormData, setReservationFormData] = useState<{
		checkInDate: string;
		checkOutDate: string;
		numberOfGuests: number;
		specialRequests: string;
	}>({
		checkInDate: "",
		checkOutDate: "",
		numberOfGuests: 1,
		specialRequests: "",
	});

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);

	// Search/filter state
	const [searchQuery, setSearchQuery] = useState("");

	// Queries
	const {
		data: profile,
		isLoading: profileLoading,
		error: profileError,
		refetch: refetchProfile,
	} = useGetProfileQuery();
	const {
		data: activeReservations = [],
		isLoading: reservationsLoading,
		refetch: refetchReservations,
	} = useGetActiveReservationsQuery();

	// Sync profile currency preference to Redux store
	useEffect(() => {
		if (profile?.currencyPreference) {
			dispatch(setCurrency(profile.currencyPreference));
		}
	}, [profile?.currencyPreference, dispatch]);

	// Filter reservations based on search query
	const filteredReservations = activeReservations.filter((res) => {
		if (!searchQuery) return true;
		
		const query = searchQuery.toLowerCase();
		const podId = (typeof res.roomId === "string" ? res.roomId : res.roomId?.podId || "").toLowerCase();
		const checkInDate = new Date(res.checkInDate).toLocaleDateString().toLowerCase();
		const checkOutDate = new Date(res.checkOutDate).toLocaleDateString().toLowerCase();
		
		return (
			podId.includes(query) ||
			checkInDate.includes(query) ||
			checkOutDate.includes(query)
		);
	});

	// Pagination calculations
	const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

	// Reset to page 1 when search query changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery]);

	// Mutations
	const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
	const [changePassword, { isLoading: isChangingPassword }] =
		useChangePasswordMutation();
	const [modifyReservation, { isLoading: isModifying }] =
		useModifyReservationMutation();
	const [cancelReservation, { isLoading: isCancelling }] =
		useCancelReservationMutation();

	// Initialize edit form when entering edit mode
	const handleEnterEditMode = () => {
		if (profile) {
			setEditFormData({
				name: profile.name || "",
				email: profile.email || "",
				currencyPreference: profile.currencyPreference || "USD",
			});
		}
		setIsEditing(true);
	};

	const handleEditChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setEditFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswordFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const updatedProfile = await updateProfile(editFormData).unwrap();
			// Explicitly sync the currency preference to Redux
			if (updatedProfile.currencyPreference) {
				dispatch(setCurrency(updatedProfile.currencyPreference));
			}
			// Refetch profile to ensure cache is updated
			await refetchProfile();
			alert("Profile updated successfully!");
			setIsEditing(false);
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to update profile"}`);
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await changePassword(passwordFormData).unwrap();
			alert("Password changed successfully!");
			setShowPasswordForm(false);
			setPasswordFormData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to change password"}`);
		}
	};

	// Reservation modification handlers
	const handleOpenModifyModal = (reservation: Reservation) => {
		setEditingReservation(reservation);
		setReservationFormData({
			checkInDate: reservation.checkInDate.split("T")[0],
			checkOutDate: reservation.checkOutDate.split("T")[0],
			numberOfGuests: reservation.numberOfGuests,
			specialRequests: reservation.specialRequests || "",
		});
	};

	const handleCloseModifyModal = () => {
		setEditingReservation(null);
		setReservationFormData({
			checkInDate: "",
			checkOutDate: "",
			numberOfGuests: 1,
			specialRequests: "",
		});
	};

	const handleReservationFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setReservationFormData((prev) => ({
			...prev,
			[name]: name === "numberOfGuests" ? parseInt(value) || 1 : value,
		}));
	};

	const handleSaveReservation = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingReservation) return;

		try {
			// Validate dates
			const checkIn = new Date(reservationFormData.checkInDate);
			const checkOut = new Date(reservationFormData.checkOutDate);
			if (checkOut <= checkIn) {
				alert("Check-out date must be after check-in date");
				return;
			}

			// Validate guest capacity
			const roomId =
				typeof editingReservation.roomId === "string"
					? editingReservation.roomId
					: editingReservation.roomId?._id;
			const room = rooms.find((r) => r._id === roomId);
			if (room && reservationFormData.numberOfGuests > room.capacity) {
				alert(`Number of guests exceeds room capacity (${room.capacity})`);
				return;
			}

			await modifyReservation({
				id: editingReservation._id,
				data: reservationFormData,
			}).unwrap();
			alert("Reservation modified successfully!");
			handleCloseModifyModal();
			// Refetch to update the list
			refetchReservations();
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to modify reservation"}`);
		}
	};

	const handleCancelReservation = async (reservationId: string) => {
		if (
			!confirm(
				"Are you sure you want to cancel this reservation? This action cannot be undone."
			)
		) {
			return;
		}

		const reason = prompt(
			"Please provide a reason for cancellation (optional):"
		);

		try {
			await cancelReservation({
				id: reservationId,
				reason: reason || "",
			}).unwrap();
			alert("Reservation cancelled successfully!");
			// Refetch to update the list
			refetchReservations();
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to cancel reservation"}`);
		}
	};

	if (profileLoading) {
		return (
			<>
				<Navbar />
				<div className="profile-page">
					<p>Loading profile...</p>
				</div>
			</>
		);
	}

	if (profileError) {
		return (
			<>
				<Navbar />
				<div className="profile-page">
					<p className="error">Error loading profile</p>
				</div>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<div className="profile-page">
				<div className="profile-container">
					{/* Profile Section */}
					<div className="profile-section">
						<h1>My Profile</h1>

						{!isEditing ? (
							<div className="profile-display">
								<div className="profile-field">
									<label>Name:</label>
									<span>{profile?.name || "Not set"}</span>
								</div>
								<div className="profile-field">
									<label>Email:</label>
									<span>{profile?.email}</span>
								</div>
								<div className="profile-field">
									<label>Account Type:</label>
									<span>
										{profile?.provider === "google" ? "Google OAuth" : "Local"}
									</span>
								</div>
								<div className="profile-field">
									<label>Currency Preference:</label>
									<span>
										{profile?.currencyPreference === "JPY"
											? "JPY (¥)"
											: "USD ($)"}
									</span>
								</div>
								<div className="profile-actions">
									<button
										onClick={handleEnterEditMode}
										className="btn-edit btn-primary"
									>
										Edit Profile
									</button>
									{profile?.provider !== "google" && (
										<button
											onClick={() => setShowPasswordForm(!showPasswordForm)}
											className="btn-password btn-secondary"
										>
											{showPasswordForm ? "Cancel" : "Change Password"}
										</button>
									)}
								</div>
							</div>
						) : (
							<form onSubmit={handleSaveProfile} className="profile-form">
								<label>
									Name:
									<input
										type="text"
										name="name"
										value={editFormData.name}
										onChange={handleEditChange}
									/>
								</label>

								<label>
									Email:
									<input
										type="email"
										name="email"
										value={editFormData.email}
										onChange={handleEditChange}
										required
									/>
								</label>

								<label>
									Currency Preference:
									<select
										name="currencyPreference"
										value={editFormData.currencyPreference}
										onChange={handleEditChange}
									>
										<option value="USD">USD ($)</option>
										<option value="JPY">JPY (¥)</option>
									</select>
								</label>

								<div className="form-actions">
									<button
										type="submit"
										disabled={isUpdating}
										className="btn-save btn-primary"
									>
										{isUpdating ? "Saving..." : "Save Changes"}
									</button>
									<button
										type="button"
										onClick={() => setIsEditing(false)}
										className="btn-cancel btn-ghost"
									>
										Cancel
									</button>
								</div>
							</form>
						)}

						{/* Password Change Form */}
						{showPasswordForm && profile?.provider !== "google" && (
							<form onSubmit={handleChangePassword} className="password-form">
								<h3>Change Password</h3>

								<label>
									Current Password:
									<input
										type="password"
										name="currentPassword"
										value={passwordFormData.currentPassword}
										onChange={handlePasswordChange}
										required
									/>
								</label>

								<label>
									New Password:
									<input
										type="password"
										name="newPassword"
										value={passwordFormData.newPassword}
										onChange={handlePasswordChange}
										required
									/>
								</label>

								<label>
									Confirm Password:
									<input
										type="password"
										name="confirmPassword"
										value={passwordFormData.confirmPassword}
										onChange={handlePasswordChange}
										required
									/>
								</label>

								<div className="form-actions">
									<button
										type="submit"
										disabled={isChangingPassword}
										className="btn-save btn-primary"
									>
										{isChangingPassword ? "Changing..." : "Change Password"}
									</button>
									<button
										type="button"
										onClick={() => setShowPasswordForm(false)}
										className="btn-cancel btn-ghost"
									>
										Cancel
									</button>
								</div>
							</form>
						)}
					</div>

					{/* Active Reservations Section */}
					<div className="reservations-section">
						<h2>My Active Reservations</h2>

						{/* Search Box */}
						{!reservationsLoading && activeReservations.length > 0 && (
							<div className="search-container">
								<input
									type="text"
									placeholder="Search by room number or date..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="search-input"
								/>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery("")}
										className="clear-search"
										aria-label="Clear search"
									>
										&times;
									</button>
								)}
							</div>
						)}

						{reservationsLoading && <p>Loading reservations...</p>}

						{!reservationsLoading && activeReservations.length === 0 && (
							<p className="no-reservations">
								You have no active reservations.
							</p>
						)}

						{!reservationsLoading && filteredReservations.length === 0 && activeReservations.length > 0 && (
							<p className="no-reservations">
								No reservations match your search.
							</p>
						)}

						{!reservationsLoading && filteredReservations.length > 0 && (
							<>
								<div className="reservations-list">
									{paginatedReservations.map((res) => (
										<div key={res._id} className="reservation-card">
											<div className="card-header">
												<h3>
													Pod{" "}
													{typeof res.roomId === "string"
														? res.roomId
														: res.roomId?.podId}
												</h3>
												<span className={`status-badge status-${res.status}`}>
													{res.status}
												</span>
											</div>
											<div className="card-details">
												<div className="detail-row">
													<label>Guest:</label>
													<span>{res.guestName}</span>
												</div>
												<div className="detail-row">
													<label>Email:</label>
													<span>{res.guestEmail}</span>
												</div>
												{res.guestPhone && (
													<div className="detail-row">
														<label>Phone:</label>
														<span>{res.guestPhone}</span>
													</div>
												)}
												<div className="detail-row">
													<label>Check-In:</label>
													<span>
														{new Date(res.checkInDate).toLocaleDateString()}
													</span>
												</div>
												<div className="detail-row">
													<label>Check-Out:</label>
													<span>
														{new Date(res.checkOutDate).toLocaleDateString()}
													</span>
												</div>
												<div className="detail-row">
													<label>Guests:</label>
													<span>{res.numberOfGuests}</span>
												</div>
												<div className="detail-row">
													<label>Total Price:</label>
													<span>{formatMoney(res.totalPrice)}</span>
												</div>
											</div>
											{res.specialRequests && (
												<div className="special-requests">
													<label>Special Requests:</label>
													<p>{res.specialRequests}</p>
												</div>
											)}
											{/* Action buttons for active reservations */}
											{res.status !== "cancelled" &&
												res.status !== "checked-out" && (
													<div className="reservation-actions">
														<button
															onClick={() => handleOpenModifyModal(res)}
															className="btn-modify btn-primary"
															disabled={
																res.status === "checked-in" || isModifying
															}
														>
															Modify
														</button>
														<button
															onClick={() => handleCancelReservation(res._id)}
															className="btn-cancel-reservation btn-danger"
															disabled={isCancelling}
														>
															Cancel Reservation
														</button>
													</div>
												)}
										</div>
									))}
								</div>
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									onPageChange={setCurrentPage}
									totalItems={filteredReservations.length}
									itemsPerPage={itemsPerPage}
									onItemsPerPageChange={setItemsPerPage}
								/>
							</>
						)}
					</div>
				</div>

				{/* Modify Reservation Modal */}
				{editingReservation && (
					<div className="modal-overlay" onClick={handleCloseModifyModal}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()}>
							<div className="modal-header">
								<h2>Modify Reservation</h2>
								<button
									onClick={handleCloseModifyModal}
									className="modal-close"
								>
									&times;
								</button>
							</div>
							<form onSubmit={handleSaveReservation} className="modal-form">
								<div className="modal-body">
									<div className="modal-info">
										<p>
											<strong>Pod:</strong>{" "}
											{typeof editingReservation.roomId === "string"
												? editingReservation.roomId
												: editingReservation.roomId?.podId}
										</p>
										<p>
											<strong>Current Status:</strong>{" "}
											<span
												className={`status-badge status-${editingReservation.status}`}
											>
												{editingReservation.status}
											</span>
										</p>
									</div>

									<label>
										Check-In Date:
										<input
											type="date"
											name="checkInDate"
											value={reservationFormData.checkInDate}
											onChange={handleReservationFormChange}
											min={new Date().toISOString().split("T")[0]}
											required
										/>
									</label>

									<label>
										Check-Out Date:
										<input
											type="date"
											name="checkOutDate"
											value={reservationFormData.checkOutDate}
											onChange={handleReservationFormChange}
											min={reservationFormData.checkInDate}
											required
										/>
									</label>

									<label>
										Number of Guests:
										<input
											type="number"
											name="numberOfGuests"
											value={reservationFormData.numberOfGuests}
											onChange={handleReservationFormChange}
											min={1}
											max={2}
											required
										/>
									</label>

									<label>
										Special Requests:
										<textarea
											name="specialRequests"
											value={reservationFormData.specialRequests}
											onChange={handleReservationFormChange}
											rows={4}
											placeholder="Any special requests or requirements..."
										/>
									</label>
								</div>

								<div className="modal-footer">
									<button
										type="submit"
										disabled={isModifying}
										className="btn-save btn-primary"
									>
										{isModifying ? "Saving..." : "Save Changes"}
									</button>
									<button
										type="button"
										onClick={handleCloseModifyModal}
										className="btn-cancel btn-ghost"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
