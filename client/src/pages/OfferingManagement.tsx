import { useState } from "react";
import Navbar from "../components/landing/Navbar";
import {
	useGetRoomOfferingsQuery,
	useGetAmenityOfferingsQuery,
	useCreateOfferingMutation,
	useUpdateOfferingMutation,
	useDeleteOfferingMutation,
} from "../features/offeringsApi";
import type { Offering } from "../types/offering";
import "./OfferingManagement.css";

/**
 * OfferingManagement - Manager page for CRUD operations on offerings
 *
 * Features:
 * - View all room and amenity offerings
 * - Create new offerings
 * - Update existing offerings
 * - Delete offerings
 * - Toggle offering active status
 */

type OfferingFormData = {
	name: string;
	type: "room" | "amenity";
	quality?: "classic" | "milk" | "golden" | "crystal" | "matcha";
	basePrice: number; // In cents
	priceType: "per-night" | "flat";
	description?: string;
	features?: string[];
	imageUrl?: string;
	capacity?: string;
	tag?: string;
	applicableFloors?: string[];
	applicableQualities?: string[];
	isActive: boolean;
};

export default function OfferingManagement() {
	const [tab, setTab] = useState<"rooms" | "amenities">("rooms");
	const [showForm, setShowForm] = useState(false);
	const [editingOffering, setEditingOffering] = useState<string | null>(null);
	const [formData, setFormData] = useState<OfferingFormData>({
		name: "",
		type: "room",
		quality: "classic",
		basePrice: 0,
		priceType: "per-night",
		description: "",
		features: [],
		imageUrl: "",
		capacity: "1 guest",
		tag: "",
		applicableFloors: [],
		applicableQualities: [],
		isActive: true,
	});

	// Feature input state
	const [featureInput, setFeatureInput] = useState("");

	// Queries
	const { data: roomOfferings = [], isLoading: loadingRooms } =
		useGetRoomOfferingsQuery({});
	const { data: amenityOfferings = [], isLoading: loadingAmenities } =
		useGetAmenityOfferingsQuery({});

	// Mutations
	const [createOffering, { isLoading: isCreating }] =
		useCreateOfferingMutation();
	const [updateOffering, { isLoading: isUpdating }] =
		useUpdateOfferingMutation();
	const [deleteOffering, { isLoading: isDeleting }] =
		useDeleteOfferingMutation();

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value, type } = e.target;

		if (name === "type") {
			// Reset type-specific fields when type changes
			setFormData((prev) => ({
				...prev,
				type: value as "room" | "amenity",
				quality: value === "room" ? "classic" : undefined,
				capacity: value === "room" ? "1 guest" : undefined,
				tag: value === "room" ? "" : undefined,
				imageUrl: value === "room" ? "" : undefined,
				applicableQualities: value === "amenity" ? [] : undefined,
			}));
		} else if (name === "basePrice") {
			// Convert dollars to cents
			setFormData((prev) => ({
				...prev,
				basePrice: Math.round(parseFloat(value) * 100) || 0,
			}));
		} else if (type === "checkbox") {
			const target = e.target as HTMLInputElement;
			setFormData((prev) => ({
				...prev,
				[name]: target.checked,
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleAddFeature = () => {
		if (featureInput.trim()) {
			setFormData((prev) => ({
				...prev,
				features: [...(prev.features || []), featureInput.trim()],
			}));
			setFeatureInput("");
		}
	};

	const handleRemoveFeature = (index: number) => {
		setFormData((prev) => ({
			...prev,
			features: prev.features?.filter((_, i) => i !== index),
		}));
	};

	const handleOpenForm = (offering?: Offering) => {
		if (offering) {
			setEditingOffering(offering._id);
			setFormData({
				name: offering.name,
				type: offering.type,
				quality: offering.quality,
				basePrice: offering.basePrice,
				priceType: offering.priceType,
				description: offering.description || "",
				features: offering.features || [],
				imageUrl: offering.imageUrl || "",
				capacity: offering.capacity || "",
				tag: offering.tag || "",
				applicableFloors: offering.applicableFloors || [],
				applicableQualities: offering.applicableQualities || [],
				isActive: offering.isActive,
			});
		} else {
			setEditingOffering(null);
			setFormData({
				name: "",
				type: tab === "rooms" ? "room" : "amenity",
				quality: tab === "rooms" ? "classic" : undefined,
				basePrice: 0,
				priceType: "per-night",
				description: "",
				features: [],
				imageUrl: "",
				capacity: "1 guest",
				tag: "",
				applicableFloors: [],
				applicableQualities: [],
				isActive: true,
			});
		}
		setShowForm(true);
	};

	const handleCloseForm = () => {
		setShowForm(false);
		setEditingOffering(null);
		setFeatureInput("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// Prepare data for submission
			const submitData: Partial<Offering> = {
				name: formData.name,
				type: formData.type,
				basePrice: formData.basePrice,
				priceType: formData.priceType,
				description: formData.description,
				features: formData.features,
				imageUrl: formData.imageUrl,
				capacity: formData.capacity,
				tag: formData.tag,
				isActive: formData.isActive,
			};

			if (formData.type === "room") {
				submitData.quality = formData.quality;
			} else {
				submitData.applicableQualities = formData.applicableQualities;
				submitData.applicableFloors = formData.applicableFloors;
			}

			if (editingOffering) {
				await updateOffering({
					id: editingOffering,
					data: submitData,
				}).unwrap();
				alert("Offering updated successfully!");
			} else {
				await createOffering(submitData).unwrap();
				alert("Offering created successfully!");
			}

			handleCloseForm();
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to save offering"}`);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this offering?")) {
			return;
		}

		try {
			await deleteOffering(id).unwrap();
			alert("Offering deleted successfully!");
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to delete offering"}`);
		}
	};

	const currentOfferings = tab === "rooms" ? roomOfferings : amenityOfferings;
	const isLoading = tab === "rooms" ? loadingRooms : loadingAmenities;

	return (
		<>
			<Navbar />
			<div className="offering-management">
				<div className="offering-management__container">
					<div className="offering-management__header">
						<h1>Offering Management</h1>
						<p>Manage room and amenity offerings for the reservation system</p>
					</div>

					{/* Tabs */}
					<div className="offering-management__tabs">
						<button
							className={`tab ${tab === "rooms" ? "active" : ""}`}
							onClick={() => setTab("rooms")}
						>
							Room Offerings ({roomOfferings.length})
						</button>
						<button
							className={`tab ${tab === "amenities" ? "active" : ""}`}
							onClick={() => setTab("amenities")}
						>
							Amenity Offerings ({amenityOfferings.length})
						</button>
					</div>

					{/* Action Bar */}
					<div className="offering-management__actions">
						<button
							onClick={() => handleOpenForm()}
							className="btn-create btn-primary"
						>
							+ Create {tab === "rooms" ? "Room" : "Amenity"} Offering
						</button>
					</div>

					{/* Offerings List */}
					{isLoading && <p>Loading offerings...</p>}

					{!isLoading && currentOfferings.length === 0 && (
						<p className="no-offerings">
							No {tab} offerings found. Create one to get started!
						</p>
					)}

					{!isLoading && currentOfferings.length > 0 && (
						<div className="offerings-grid">
							{currentOfferings.map((offering) => (
								<div
									key={offering._id}
									className={`offering-card ${
										!offering.isActive ? "inactive" : ""
									}`}
								>
									<div className="offering-card__header">
										<h3>{offering.name}</h3>
										<div className="offering-card__badges">
											{offering.tag && (
												<span className="badge badge-tag">{offering.tag}</span>
											)}
											{offering.isActive ? (
												<span className="badge badge-active">Active</span>
											) : (
												<span className="badge badge-inactive">Inactive</span>
											)}
										</div>
									</div>

									<div className="offering-card__content">
										{offering.description && <p>{offering.description}</p>}

										<div className="offering-detail">
											<strong>Price:</strong> $
											{(offering.basePrice / 100).toFixed(2)}
											{offering.priceType === "per-night" ? "/night" : " flat"}
										</div>

										{offering.type === "room" && offering.quality && (
											<div className="offering-detail">
												<strong>Quality:</strong> {offering.quality}
											</div>
										)}

										{offering.capacity && (
											<div className="offering-detail">
												<strong>Capacity:</strong> {offering.capacity}
											</div>
										)}

										{offering.features && offering.features.length > 0 && (
											<div className="offering-detail">
												<strong>Features:</strong>
												<ul className="feature-list">
													{offering.features.map((feature, idx) => (
														<li key={idx}>{feature}</li>
													))}
												</ul>
											</div>
										)}

										{offering.type === "amenity" &&
											offering.applicableQualities &&
											offering.applicableQualities.length > 0 && (
												<div className="offering-detail">
													<strong>Applicable to:</strong>{" "}
													{offering.applicableQualities.join(", ") ||
														"All qualities"}
												</div>
											)}
									</div>

									<div className="offering-card__actions">
										<button
											onClick={() => handleOpenForm(offering)}
											className="btn-edit btn-secondary"
										>
											Edit
										</button>
										<button
											onClick={() => handleDelete(offering._id)}
											className="btn-delete btn-danger"
											disabled={isDeleting}
										>
											Delete
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Form Modal */}
				{showForm && (
					<div className="modal-overlay" onClick={handleCloseForm}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()}>
							<div className="modal-header">
								<h2>
									{editingOffering ? "Edit" : "Create"}{" "}
									{formData.type === "room" ? "Room" : "Amenity"} Offering
								</h2>
								<button onClick={handleCloseForm} className="modal-close">
									&times;
								</button>
							</div>

							<form onSubmit={handleSubmit} className="modal-form">
								<div className="modal-body">
									<label>
										Name:
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleInputChange}
											required
											placeholder="e.g., Classic Pearl"
										/>
									</label>

									<label>
										Type:
										<select
											name="type"
											value={formData.type}
											onChange={handleInputChange}
											required
											disabled={!!editingOffering}
										>
											<option value="room">Room</option>
											<option value="amenity">Amenity</option>
										</select>
									</label>

									{formData.type === "room" && (
										<label>
											Quality Level:
											<select
												name="quality"
												value={formData.quality}
												onChange={handleInputChange}
												required
											>
												<option value="classic">Classic</option>
												<option value="milk">Milk</option>
												<option value="golden">Golden</option>
												<option value="crystal">Crystal</option>
												<option value="matcha">Matcha</option>
											</select>
										</label>
									)}

									<label>
										Base Price ($):
										<input
											type="number"
											name="basePrice"
											value={(formData.basePrice / 100).toFixed(2)}
											onChange={handleInputChange}
											min="0"
											step="0.01"
											required
											placeholder="e.g., 65.00"
										/>
									</label>

									<label>
										Price Type:
										<select
											name="priceType"
											value={formData.priceType}
											onChange={handleInputChange}
											required
										>
											<option value="per-night">Per Night</option>
											<option value="flat">Flat Fee</option>
										</select>
									</label>

									<label>
										Description:
										<textarea
											name="description"
											value={formData.description}
											onChange={handleInputChange}
											rows={3}
											placeholder="Brief description of this offering..."
										/>
									</label>

									{formData.type === "room" && (
										<>
											<label>
												Image URL:
												<input
													type="text"
													name="imageUrl"
													value={formData.imageUrl}
													onChange={handleInputChange}
													placeholder="/images/capsules/classic-pearl.jpg"
												/>
											</label>

											<label>
												Capacity:
												<input
													type="text"
													name="capacity"
													value={formData.capacity}
													onChange={handleInputChange}
													placeholder="e.g., 1 guest or 1-2 guests"
												/>
											</label>

											<label>
												Tag (optional):
												<input
													type="text"
													name="tag"
													value={formData.tag}
													onChange={handleInputChange}
													placeholder="e.g., Women Only, First Class"
												/>
											</label>
										</>
									)}

									<div className="features-section">
										<label>Features:</label>
										<div className="feature-input-group">
											<input
												type="text"
												value={featureInput}
												onChange={(e) => setFeatureInput(e.target.value)}
												placeholder="Add a feature..."
												onKeyPress={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleAddFeature();
													}
												}}
											/>
											<button
												type="button"
												onClick={handleAddFeature}
												className="btn-add-feature"
											>
												Add
											</button>
										</div>
										{formData.features && formData.features.length > 0 && (
											<ul className="feature-list-edit">
												{formData.features.map((feature, idx) => (
													<li key={idx}>
														{feature}
														<button
															type="button"
															onClick={() => handleRemoveFeature(idx)}
															className="btn-remove-feature"
														>
															×
														</button>
													</li>
												))}
											</ul>
										)}
									</div>

									<label className="checkbox-label">
										<input
											type="checkbox"
											name="isActive"
											checked={formData.isActive}
											onChange={handleInputChange}
										/>
										<span>Active (visible to customers)</span>
									</label>
								</div>

								<div className="modal-footer">
									<button
										type="submit"
										disabled={isCreating || isUpdating}
										className="btn-save btn-primary"
									>
										{isCreating || isUpdating
											? "Saving..."
											: editingOffering
											? "Update Offering"
											: "Create Offering"}
									</button>
									<button
										type="button"
										onClick={handleCloseForm}
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
