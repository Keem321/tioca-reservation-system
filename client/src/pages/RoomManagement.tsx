import { useState } from "react";
import {
	useGetRoomsQuery,
	useGetRoomsByHotelQuery,
	useCreateRoomMutation,
	useUpdateRoomMutation,
	useDeleteRoomMutation,
	useUpdateRoomStatusMutation,
} from "../features/roomsApi";
import { useGetHotelsQuery } from "../features/hotelsApi";
import type { Room, RoomFormData, PodQuality, PodFloor } from "../types/room";
import type { Hotel } from "../types/hotel";
import "./RoomManagement.css";

/**
 * Helper function to get display name for pod quality
 */
const getQualityDisplayName = (quality: PodQuality): string => {
	const qualityMap: Record<PodQuality, string> = {
		classic: "Classic Pearl",
		milk: "Milk Pearl",
		golden: "Golden Pearl",
		crystal: "Crystal Boba Suite",
		matcha: "Matcha Pearl",
	};
	return qualityMap[quality];
};

/**
 * Helper function to get full pod display name with "Twin" prefix for couples floor
 */
const getPodDisplayName = (quality: PodQuality, floor: PodFloor): string => {
	const baseName = getQualityDisplayName(quality);
	return floor === "couples" ? `Twin ${baseName}` : baseName;
};

/**
 * Quality level dimensions mapping (in inches)
 */
const QUALITY_DIMENSIONS: Record<
	PodQuality,
	{ length: number; width: number; height: number }
> = {
	classic: { length: 80, width: 40, height: 40 },
	milk: { length: 84, width: 42, height: 45 },
	golden: { length: 86, width: 45, height: 50 },
	crystal: { length: 90, width: 55, height: 65 },
	matcha: { length: 86, width: 45, height: 50 },
};

/**
 * RoomManagement - Manager page for CRUD operations on pods
 *
 * Features:
 * - View all pods or filter by hotel
 * - Create new pods
 * - Update existing pods
 * - Delete pods
 * - Update pod status
 */

export default function RoomManagement() {
	const [selectedHotelId, setSelectedHotelId] = useState<string>("");
	const [showForm, setShowForm] = useState(false);
	const [editingRoom, setEditingRoom] = useState<string | null>(null);
	const [formData, setFormData] = useState<RoomFormData>({
		hotelId: "",
		podId: "", // Will be auto-generated on submit
		quality: "classic",
		floor: "men-only", // Floor is now the zone
		pricePerNight: 0,
		description: "",
		amenities: [],
		status: "available",
		dimensions: QUALITY_DIMENSIONS.classic,
	});

	// Fetch hotels for the dropdown
	const { data: hotels = [] } = useGetHotelsQuery(undefined);

	// Fetch rooms - use skip option instead of conditional hook calls
	const {
		data: allRooms = [],
		isLoading: isLoadingAll,
		error: errorAll,
	} = useGetRoomsQuery(undefined, {
		skip: !!selectedHotelId,
	});
	const {
		data: hotelRooms = [],
		isLoading: isLoadingHotel,
		error: errorHotel,
	} = useGetRoomsByHotelQuery(selectedHotelId, {
		skip: !selectedHotelId,
	});

	const rooms = selectedHotelId ? hotelRooms : allRooms;
	const isLoading = selectedHotelId ? isLoadingHotel : isLoadingAll;
	const error = selectedHotelId ? errorHotel : errorAll;

	// Mutations
	const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation();
	const [updateRoom, { isLoading: isUpdating }] = useUpdateRoomMutation();
	const [deleteRoom] = useDeleteRoomMutation();
	const [updateRoomStatus] = useUpdateRoomStatusMutation();

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value } = e.target;

		// Handle nested dimensions fields
		if (name.startsWith("dimensions.")) {
			const dimField = name.split(".")[1] as "length" | "width" | "height";
			setFormData((prev) => ({
				...prev,
				dimensions: {
					...prev.dimensions!,
					[dimField]: Number(value),
				},
			}));
		} else if (name === "quality") {
			// Auto-update dimensions when quality changes
			setFormData((prev) => ({
				...prev,
				quality: value as PodQuality,
				dimensions: QUALITY_DIMENSIONS[value as PodQuality],
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: name === "pricePerNight" ? Number(value) : value,
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (editingRoom) {
				await updateRoom({ id: editingRoom, data: formData }).unwrap();
				alert("Room updated successfully!");
			} else {
				await createRoom(formData).unwrap();
				alert("Room created successfully!");
			}
			resetForm();
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to save room"}`);
		}
	};

	const handleEdit = (room: Room) => {
		setEditingRoom(room._id);
		setFormData({
			hotelId:
				typeof room.hotelId === "string" ? room.hotelId : room.hotelId._id,
			podId: room.podId,
			quality: room.quality,
			floor: room.floor,
			pricePerNight: room.pricePerNight,
			description: room.description || "",
			amenities: room.amenities || [],
			status: room.status,
			dimensions: room.dimensions || QUALITY_DIMENSIONS[room.quality],
		});
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (window.confirm("Are you sure you want to delete this room?")) {
			try {
				await deleteRoom(id).unwrap();
				alert("Room deleted successfully!");
			} catch (err) {
				const error = err as { data?: { error?: string } };
				alert(`Error: ${error?.data?.error || "Failed to delete room"}`);
			}
		}
	};

	const handleStatusChange = async (id: string, newStatus: string) => {
		try {
			await updateRoomStatus({ id, status: newStatus }).unwrap();
			alert("Status updated successfully!");
		} catch (err) {
			const error = err as { data?: { error?: string } };
			alert(`Error: ${error?.data?.error || "Failed to update status"}`);
		}
	};

	const resetForm = () => {
		setFormData({
			hotelId: "",
			podId: "",
			quality: "classic",
			floor: "men-only",
			pricePerNight: 0,
			description: "",
			amenities: [],
			status: "available",
			dimensions: QUALITY_DIMENSIONS.classic,
		});
		setEditingRoom(null);
		setShowForm(false);
	};

	return (
		<div className="room-management">
			<h1>Room Management</h1>

			{/* Filter by Hotel */}
			<div className="filters">
				<label>
					Filter by Hotel:
					<select
						value={selectedHotelId}
						onChange={(e) => setSelectedHotelId(e.target.value)}
					>
						<option value="">All Hotels</option>
						{hotels.map((hotel: Hotel) => (
							<option key={hotel._id} value={hotel._id}>
								{hotel.name}
							</option>
						))}
					</select>
				</label>
				<button onClick={() => setShowForm(!showForm)}>
					{showForm ? "Cancel" : "Add New Room"}
				</button>
			</div>

			{/* Form */}
			{showForm && (
				<div className="room-form">
					<h2>{editingRoom ? "Edit Pod" : "Create New Pod"}</h2>
					<form onSubmit={handleSubmit}>
						<div className="form-grid">
							<label>
								Hotel:
								<select
									name="hotelId"
									value={formData.hotelId}
									onChange={handleInputChange}
									required
								>
									<option value="">Select Hotel</option>
									{hotels.map((hotel: Hotel) => (
										<option key={hotel._id} value={hotel._id}>
											{hotel.name}
										</option>
									))}
								</select>
							</label>

							<label>
								Floor (Zone):
								<select
									name="floor"
									value={formData.floor}
									onChange={handleInputChange}
									required
								>
									<option value="women-only">Women-Only Floor</option>
									<option value="men-only">Men-Only Floor</option>
									<option value="couples">Couples Floor</option>
									<option value="business">Business/Quiet Floor</option>
								</select>
							</label>

							<label>
								Pod ID:
								<input
									type="text"
									value={formData.podId || "(auto-generated)"}
									disabled
									readOnly
									style={{
										backgroundColor: "#f0f0f0",
										color: "#666",
										cursor: "not-allowed",
									}}
								/>
								<small
									style={{
										display: "block",
										marginTop: "0.25rem",
										color: "#666",
									}}
								>
									Auto-generated as FloorNum + 2-digit sequence (e.g., 301)
								</small>
							</label>

							<label>
								Pod Quality Level:
								<select
									name="quality"
									value={formData.quality}
									onChange={handleInputChange}
									required
								>
									<option value="classic">Classic Pearl (Standard)</option>
									<option value="milk">Milk Pearl (Standard+)</option>
									<option value="golden">Golden Pearl (Premium)</option>
									<option value="crystal">
										Crystal Boba Suite (First Class)
									</option>
									<option value="matcha">
										Matcha Pearl (Women-Only Exclusive)
									</option>
								</select>
							</label>

							<label>
								Capacity (Auto):
								<input
									type="text"
									value={formData.floor === "couples" ? "2 guests" : "1 guest"}
									disabled
									readOnly
									style={{
										backgroundColor: "#f0f0f0",
										color: "#666",
										cursor: "not-allowed",
									}}
								/>
								<small
									style={{
										display: "block",
										marginTop: "0.25rem",
										color: "#666",
									}}
								>
									Auto-determined by floor: couples floors = 2, others = 1
								</small>
							</label>

							<label>
								Price Per Night ($):
								<input
									type="number"
									name="pricePerNight"
									value={formData.pricePerNight}
									onChange={handleInputChange}
									min="0"
									step="0.01"
									required
								/>
							</label>

							<label>
								Length (inches):
								<input
									type="number"
									name="dimensions.length"
									value={formData.dimensions?.length || 80}
									onChange={handleInputChange}
									min="0"
								/>
								<small
									style={{
										display: "block",
										marginTop: "0.25rem",
										color: "#666",
									}}
								>
									Auto-set by quality level (edit to customize)
								</small>
							</label>

							<label>
								Width (inches):
								<input
									type="number"
									name="dimensions.width"
									value={formData.dimensions?.width || 40}
									onChange={handleInputChange}
									min="0"
								/>
								<small
									style={{
										display: "block",
										marginTop: "0.25rem",
										color: "#666",
									}}
								>
									Auto-set by quality level (edit to customize)
								</small>
							</label>

							<label>
								Height (inches):
								<input
									type="number"
									name="dimensions.height"
									value={formData.dimensions?.height || 40}
									onChange={handleInputChange}
									min="0"
								/>
								<small
									style={{
										display: "block",
										marginTop: "0.25rem",
										color: "#666",
									}}
								>
									Auto-set by quality level (edit to customize)
								</small>
							</label>

							<label>
								Status:
								<select
									name="status"
									value={formData.status}
									onChange={handleInputChange}
								>
									<option value="available">Available</option>
									<option value="occupied">Occupied</option>
									<option value="maintenance">Maintenance</option>
									<option value="reserved">Reserved</option>
								</select>
							</label>
						</div>

						<label>
							Description:
							<textarea
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								rows={3}
							/>
						</label>

						<div className="form-actions">
							<button type="submit" disabled={isCreating || isUpdating}>
								{isCreating || isUpdating
									? "Saving..."
									: editingRoom
									? "Update Pod"
									: "Create Pod"}
							</button>
							<button type="button" onClick={resetForm}>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Pod List */}
			<div className="room-list">
				<h2>Pods</h2>
				{isLoading && <p>Loading pods...</p>}
				{error && <p className="error">Error loading pods</p>}

				{!isLoading && rooms.length === 0 && (
					<p>No pods found. Create one to get started!</p>
				)}

				{rooms.length > 0 && (
					<table>
						<thead>
							<tr>
								<th>Hotel</th>
								<th>Pod ID</th>
								<th>Pod Name</th>
								<th>Floor (Zone)</th>
								<th>Capacity</th>
								<th>Price/Night</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{rooms.map((room: Room) => (
								<tr key={room._id}>
									<td>
										{typeof room.hotelId === "string"
											? room.hotelId
											: room.hotelId?.name || "N/A"}
									</td>
									<td>{room.podId}</td>
									<td>
										<div className="pod-type-cell">
											{getPodDisplayName(room.quality, room.floor)}
											{room.dimensions && (
												<span className="dimensions">
													{room.dimensions.length}"×{room.dimensions.width}"×
													{room.dimensions.height}"
												</span>
											)}
										</div>
									</td>
									<td>
										<span className={`zone-badge zone-${room.floor}`}>
											{room.floor}
										</span>
									</td>
									<td>{room.capacity}</td>
									<td>${room.pricePerNight}</td>
									<td>
										<select
											value={room.status}
											onChange={(e) =>
												handleStatusChange(room._id, e.target.value)
											}
											className={`status-${room.status}`}
										>
											<option value="available">Available</option>
											<option value="occupied">Occupied</option>
											<option value="maintenance">Maintenance</option>
											<option value="reserved">Reserved</option>
										</select>
									</td>
									<td className="actions">
										<button onClick={() => handleEdit(room)}>Edit</button>
										<button
											onClick={() => handleDelete(room._id)}
											className="delete"
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
		</div>
	);
}
