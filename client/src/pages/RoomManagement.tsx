import { useMemo, useState } from "react";
import Navbar from "../components/landing/Navbar";
import {
	useGetRoomsQuery,
	useCreateRoomMutation,
	useUpdateRoomMutation,
	useDeleteRoomMutation,
	useUpdateRoomStatusMutation,
} from "../features/roomsApi";
import { useGetReservationsQuery } from "../features/reservationsApi";
import { useGetRoomOfferingsQuery } from "../features/offeringsApi";
import type { Room, RoomFormData, PodQuality, PodFloor } from "../types/room";
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
 * - View all pods
 * - Create new pods
 * - Update existing pods
 * - Delete pods
 * - Update pod status
 */

export default function RoomManagement() {
	// UI mode: tabs
	const [tab, setTab] = useState<"booked" | "all" | "floor">("booked");

	const [showForm, setShowForm] = useState(false);
	const [editingRoom, setEditingRoom] = useState<string | null>(null);
	const [formData, setFormData] = useState<RoomFormData>({
		podId: "", // Will be auto-generated on submit
		quality: "classic",
		floor: "men-only", // Floor is now the zone
		offeringId: "",
		description: "",
		amenities: [],
		status: "available",
		dimensions: QUALITY_DIMENSIONS.classic,
	});

	// Fetch rooms
	const { data: rooms = [], isLoading, error } = useGetRoomsQuery(undefined);

	// Fetch all reservations (manager-only)
	const { data: reservations = [] } = useGetReservationsQuery();

	// Fetch offerings for dropdown
	const { data: offerings = [] } = useGetRoomOfferingsQuery({});

	// Filters
	const [search, setSearch] = useState("");
	const [filterFloor, setFilterFloor] = useState<"" | PodFloor>("");
	const [filterStatus, setFilterStatus] = useState<"" | Room["status"]>("");

	// Two-week window default for "Booked" tab
	const [startDate, setStartDate] = useState<string>(() =>
		new Date().toISOString().slice(0, 10)
	);
	const [endDate, setEndDate] = useState<string>(() => {
		const d = new Date();
		d.setDate(d.getDate() + 14);
		return d.toISOString().slice(0, 10);
	});

	// Reservations overlapping helper
	const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
		return aStart < bEnd && aEnd > bStart;
	};

	// Compute booked roomIds for the selected window
	const windowStart = useMemo(() => new Date(startDate), [startDate]);
	const windowEnd = useMemo(() => new Date(endDate), [endDate]);
	const activeStatuses = useMemo(
		() => new Set(["pending", "confirmed", "checked-in"]),
		[]
	);
	const bookedRoomIds = useMemo(() => {
		return new Set(
			reservations
				.filter(
					(r) =>
						activeStatuses.has(r.status) &&
						overlaps(
							new Date(r.checkInDate),
							new Date(r.checkOutDate),
							windowStart,
							windowEnd
						)
				)
				.map((r) => (typeof r.roomId === "string" ? r.roomId : r.roomId._id))
		);
	}, [reservations, windowStart, windowEnd, activeStatuses]);

	// Derived lists per tab
	const filteredRooms = useMemo(() => {
		return rooms.filter((room) => {
			if (search && !room.podId.toLowerCase().includes(search.toLowerCase()))
				return false;
			if (filterFloor && room.floor !== filterFloor) return false;
			if (filterStatus && room.status !== filterStatus) return false;
			return true;
		});
	}, [rooms, search, filterFloor, filterStatus]);

	const bookedRooms = useMemo(() => {
		return filteredRooms.filter((r) => bookedRoomIds.has(r._id));
	}, [filteredRooms, bookedRoomIds]);

	// Per-floor summary for the overview grid
	const floorKeys = useMemo<PodFloor[]>(
		() => ["women-only", "men-only", "couples", "business"],
		[]
	);
	const floorSummary = useMemo(() => {
		const base = Object.fromEntries(
			floorKeys.map((f) => [
				f,
				{ total: 0, windowAvailable: 0, windowBooked: 0, maintenance: 0 },
			])
		) as Record<
			PodFloor,
			{
				total: number;
				windowAvailable: number;
				windowBooked: number;
				maintenance: number;
			}
		>;
		for (const r of rooms) {
			const s = base[r.floor];
			s.total += 1;
			if (r.status === "maintenance") {
				s.maintenance += 1;
				continue;
			}
			if (bookedRoomIds.has(r._id)) {
				s.windowBooked += 1;
			} else {
				s.windowAvailable += 1;
			}
		}
		return base;
	}, [rooms, bookedRoomIds, floorKeys]);

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
			podId: room.podId,
			quality: room.quality,
			floor: room.floor,
			offeringId: room.offeringId || "",
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
			podId: "",
			quality: "classic",
			floor: "men-only",
			offeringId: "",
			description: "",
			amenities: [],
			status: "available",
			dimensions: QUALITY_DIMENSIONS.classic,
		});
		setEditingRoom(null);
		setShowForm(false);
	};

	return (
		<>
			<Navbar />
			<div className="room-management">
				<h1>Room Management</h1>
				<div className="rm-tabs">
					<button
						className={tab === "booked" ? "active" : ""}
						onClick={() => setTab("booked")}
					>
						Booked (Next 2 Weeks)
					</button>
					<button
						className={tab === "all" ? "active" : ""}
						onClick={() => setTab("all")}
					>
						All Rooms
					</button>
					<button
						className={tab === "floor" ? "active" : ""}
						onClick={() => setTab("floor")}
					>
						By Floor
					</button>
					<div className="spacer" />
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
										value={
											formData.floor === "couples" ? "2 guests" : "1 guest"
										}
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
									Price Per Night ($): Room Offering (Pricing Tier):
									<select
										name="offeringId"
										value={formData.offeringId}
										onChange={handleInputChange}
										required
									>
										<option value="">Select offering...</option>
										{offerings.map((offering) => (
											<option key={offering._id} value={offering._id}>
												{offering.name} - $
												{(offering.basePrice / 100).toFixed(2)}/night (
												{offering.quality})
											</option>
										))}
									</select>
									<small
										style={{
											display: "block",
											marginTop: "0.25rem",
											color: "#666",
										}}
									>
										Select the pricing tier for this room. Manage offerings in
										Offering Management.
									</small>
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

				{/* Filters shared (search, floor, status) */}
				<div className="filters">
					<label>
						Search PodId
						<input
							type="text"
							placeholder="e.g. 201"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</label>
					<label>
						Floor
						<select
							value={filterFloor}
							onChange={(e) => setFilterFloor(e.target.value as "" | PodFloor)}
						>
							<option value="">All</option>
							<option value="women-only">Women-Only</option>
							<option value="men-only">Men-Only</option>
							<option value="couples">Couples</option>
							<option value="business">Business</option>
						</select>
					</label>
					<label>
						Status
						<select
							value={filterStatus}
							onChange={(e) =>
								setFilterStatus(e.target.value as "" | Room["status"])
							}
						>
							<option value="">All</option>
							<option value="available">Available</option>
							<option value="reserved">Reserved</option>
							<option value="occupied">Occupied</option>
							<option value="maintenance">Maintenance</option>
						</select>
					</label>
					{(tab === "booked" || tab === "floor") && (
						<div className="date-range">
							<label>
								Start
								<input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</label>
							<label>
								End
								<input
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
								/>
							</label>
						</div>
					)}
					<div className="spacer" />
					<button onClick={() => setShowForm(!showForm)}>
						{showForm ? "Cancel" : "Add New Room"}
					</button>
				</div>

				{/* Tab: Booked (Next Two Weeks) */}
				{tab === "booked" && (
					<div className="room-list">
						<h2>Booked Rooms in Selected Window</h2>
						{isLoading && <p>Loading pods...</p>}
						{error && <p className="error">Error loading pods</p>}
						{!isLoading && bookedRooms.length === 0 && (
							<p>No rooms booked in this window.</p>
						)}
						{bookedRooms.length > 0 && (
							<table>
								<thead>
									<tr>
										<th>Pod</th>
										<th>Floor</th>
										<th>Quality</th>
										<th>Next Booking</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{bookedRooms.map((room) => {
										const next = reservations
											.filter((r) => activeStatuses.has(r.status))
											.filter((r) =>
												typeof r.roomId === "string"
													? r.roomId === room._id
													: r.roomId._id === room._id
											)
											.filter((r) =>
												overlaps(
													new Date(r.checkInDate),
													new Date(r.checkOutDate),
													windowStart,
													windowEnd
												)
											)
											.sort(
												(a, b) =>
													new Date(a.checkInDate).getTime() -
													new Date(b.checkInDate).getTime()
											)[0];
										return (
											<tr key={room._id}>
												<td>{room.podId}</td>
												<td>{room.floor}</td>
												<td>{getPodDisplayName(room.quality, room.floor)}</td>
												<td>
													{next
														? `${new Date(
																next.checkInDate
														  ).toLocaleDateString()} → ${new Date(
																next.checkOutDate
														  ).toLocaleDateString()}`
														: "-"}
												</td>
												<td className={`status-${room.status}`}>
													{room.status}
												</td>
												<td className="actions">
													<button onClick={() => handleEdit(room)}>Edit</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</div>
				)}

				{/* Tab: All Rooms (original table with filters) */}
				{tab === "all" && (
					<div className="room-list">
						<h2>All Rooms</h2>
						{isLoading && <p>Loading pods...</p>}
						{error && <p className="error">Error loading pods</p>}
						{!isLoading && filteredRooms.length === 0 && <p>No pods found.</p>}
						{filteredRooms.length > 0 && (
							<table>
								<thead>
									<tr>
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
									{filteredRooms.map((room: Room) => (
										<tr key={room._id}>
											<td>{room.podId}</td>
											<td>
												<div className="pod-type-cell">
													{getPodDisplayName(room.quality, room.floor)}
													{room.dimensions && (
														<span className="dimensions">
															{room.dimensions.length}"×{room.dimensions.width}
															"×
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
											<td>
												$
												{room.offering?.basePrice
													? (room.offering.basePrice / 100).toFixed(2)
													: "0.00"}
											</td>
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
				)}

				{/* Tab: By Floor overview */}
				{tab === "floor" && (
					<div className="floor-grid">
						{floorKeys.map((floor) => {
							const s = floorSummary[floor];
							const denom = s.total - s.maintenance;
							const occ =
								denom > 0 ? Math.round((s.windowBooked / denom) * 100) : 0;
							return (
								<div className={`floor-card zone-${floor}`} key={floor}>
									<h3>{floor}</h3>
									<div className="metrics">
										<span>Total: {s.total}</span>
										<span>Available (window): {s.windowAvailable}</span>
										<span>Booked (window): {s.windowBooked}</span>
										<span>Maint.: {s.maintenance}</span>
									</div>
									<div className="bar">
										<div style={{ width: `${occ}%` }} />
									</div>
									<small>Occupancy in window: {occ}%</small>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</>
	);
}
