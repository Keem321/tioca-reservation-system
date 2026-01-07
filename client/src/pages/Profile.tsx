import { useState, useEffect, useRef } from "react";
import Navbar from "../components/landing/Navbar";
import {
	useGetProfileQuery,
	useUpdateProfileMutation,
	useChangePasswordMutation,
	useGetActiveReservationsQuery,
} from "../features/userApi";
import "./Profile.css";

/**
 * Profile Page - User profile management and active reservations
 *
 * Features:
 * - View profile information (name, email)
 * - Edit profile (name, email)
 * - Change password (for local strategy users)
 * - View active/upcoming reservations
 */
export default function Profile() {
	const [isEditing, setIsEditing] = useState(false);
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [editFormData, setEditFormData] = useState<{
		name: string;
		email: string;
	}>({ name: "", email: "" });
	const [passwordFormData, setPasswordFormData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const hasInitialized = useRef(false);

	// Queries
	const {
		data: profile,
		isLoading: profileLoading,
		error: profileError,
	} = useGetProfileQuery();
	const { data: activeReservations = [], isLoading: reservationsLoading } =
		useGetActiveReservationsQuery();

	// Mutations
	const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
	const [changePassword, { isLoading: isChangingPassword }] =
		useChangePasswordMutation();

	// Initialize edit form when profile loads - only once
	useEffect(() => {
		if (profile && !hasInitialized.current) {
			setEditFormData({
				name: profile.name || "",
				email: profile.email || "",
			});
			hasInitialized.current = true;
		}
	}, [profile]);

	const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
			await updateProfile(editFormData).unwrap();
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
								<div className="profile-actions">
									<button
										onClick={() => setIsEditing(true)}
										className="btn-edit"
									>
										Edit Profile
									</button>
									{profile?.provider !== "google" && (
										<button
											onClick={() => setShowPasswordForm(!showPasswordForm)}
											className="btn-password"
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

								<div className="form-actions">
									<button
										type="submit"
										disabled={isUpdating}
										className="btn-save"
									>
										{isUpdating ? "Saving..." : "Save Changes"}
									</button>
									<button
										type="button"
										onClick={() => setIsEditing(false)}
										className="btn-cancel"
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
										className="btn-save"
									>
										{isChangingPassword ? "Changing..." : "Change Password"}
									</button>
									<button
										type="button"
										onClick={() => setShowPasswordForm(false)}
										className="btn-cancel"
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

						{reservationsLoading && <p>Loading reservations...</p>}

						{!reservationsLoading && activeReservations.length === 0 && (
							<p className="no-reservations">
								You have no active reservations.
							</p>
						)}

						{!reservationsLoading && activeReservations.length > 0 && (
							<div className="reservations-list">
								{activeReservations.map((res) => (
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
												<span>${res.totalPrice}</span>
											</div>
										</div>
										{res.specialRequests && (
											<div className="special-requests">
												<label>Special Requests:</label>
												<p>{res.specialRequests}</p>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
