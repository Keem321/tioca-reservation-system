import { useMemo, useState } from "react";
import Navbar from "../components/landing/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Search, Calendar } from "lucide-react";
import Pagination from "../components/Pagination";
import {
	useGetRoomsQuery,
	useCreateRoomMutation,
	useUpdateRoomMutation,
	useDeleteRoomMutation,
	useUpdateRoomStatusMutation,
} from "../features/roomsApi";
import { useGetReservationsQuery } from "../features/reservationsApi";
import { useGetRoomOfferingsQuery } from "../features/offeringsApi";
import { useFormatMoney } from "../hooks/useFormatMoney";
import type { Room, RoomFormData, PodQuality, PodFloor } from "../types/room";
import RoleGuard from "../components/RoleGuard";
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
	const { formatPricePerNight, formatMoney } = useFormatMoney();

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

	const resetPage = () => setCurrentPage(1);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Two-week window default for "Booked" tab
	const [startDate, setStartDate] = useState<string>(() =>
		new Date().toISOString().slice(0, 10)
	);
	const [endDate, setEndDate] = useState<string>(() => {
		const d = new Date();
		d.setDate(d.getDate() + 14);
		return d.toISOString().slice(0, 10);
	});

	// Calculate active filter count (after all state declarations)
	const activeFilterCount = [
		search,
		filterFloor,
		filterStatus,
		...(tab === "booked" || tab === "floor" ? [startDate, endDate] : []),
	].filter(Boolean).length;

	// Reservations overlapping helper
	const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
		return aStart < bEnd && aEnd > bStart;
	};

	// Compute booked roomIds for the selected window
	const windowStart = useMemo(() => {
		if (startDate) {
			const parsed = new Date(startDate);
			return isNaN(parsed.getTime()) ? new Date() : parsed;
		}
		return new Date();
	}, [startDate]);
	const windowEnd = useMemo(() => {
		if (endDate) {
			const parsed = new Date(endDate);
			return isNaN(parsed.getTime()) ? new Date() : parsed;
		}
		const fallback = new Date(windowStart);
		fallback.setDate(fallback.getDate() + 14);
		return fallback;
	}, [endDate, windowStart]);
	const activeStatuses = useMemo(
		() => new Set(["pending", "confirmed", "checked-in"]),
		[]
	);
	const bookedRoomIds = useMemo(() => {
		return new Set(
			reservations
				.filter((r) => {
					// Only filter by active status if dates are not set
					if (!windowStart || !windowEnd) {
						return activeStatuses.has(r.status);
					}
					// Filter by date range if dates are set
					return (
						activeStatuses.has(r.status) &&
						overlaps(
							new Date(r.checkInDate),
							new Date(r.checkOutDate),
							windowStart,
							windowEnd
						)
					);
				})
				.map((r) => (typeof r.roomId === "string" ? r.roomId : r.roomId?._id))
				.filter((id): id is string => id !== null && id !== undefined)
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

	const allBookedRooms = useMemo(() => {
		return filteredRooms.filter((r) => bookedRoomIds.has(r._id));
	}, [filteredRooms, bookedRoomIds]);

	// Pagination for booked rooms
	const bookedTotalPages = Math.ceil(allBookedRooms.length / itemsPerPage);
	const bookedStartIndex = (currentPage - 1) * itemsPerPage;
	const bookedEndIndex = bookedStartIndex + itemsPerPage;
	const bookedRooms = allBookedRooms.slice(bookedStartIndex, bookedEndIndex);

	// Pagination for all rooms
	const allRoomsTotalPages = Math.ceil(filteredRooms.length / itemsPerPage);
	const allRoomsStartIndex = (currentPage - 1) * itemsPerPage;
	const allRoomsEndIndex = allRoomsStartIndex + itemsPerPage;
	const paginatedAllRooms = filteredRooms.slice(
		allRoomsStartIndex,
		allRoomsEndIndex
	);

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
						onClick={() => {
							setTab("booked");
							resetPage();
						}}
					>
						Booked (Next 2 Weeks)
					</button>
					<button
						className={tab === "all" ? "active" : ""}
						onClick={() => {
							setTab("all");
							resetPage();
						}}
					>
						All Rooms
					</button>
					<button
						className={tab === "floor" ? "active" : ""}
						onClick={() => {
							setTab("floor");
							resetPage();
						}}
					>
						By Floor
					</button>
					<div className="spacer" />
					<RoleGuard requiredRoles="admin">
						<button onClick={() => setShowForm(!showForm)}>
							{showForm ? "Cancel" : "Add New Room"}
						</button>
					</RoleGuard>
				</div>

				{/* Form - Admin only */}
				<RoleGuard requiredRoles="admin">
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
													{offering.name} -{" "}
													{formatPricePerNight(offering.basePrice)} (
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
				</RoleGuard>

				{/* Filters shared (search, floor, status) */}
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
								setSearch("");
								setFilterFloor("");
								setFilterStatus("");
								setStartDate("");
								setEndDate("");
								setCurrentPage(1);
							}}
							disabled={activeFilterCount === 0}
						>
							Clear All Filters
						</button>
					</div>

					<div className="filters__content">
						<div className="filter-group">
							<label className="filter-label">
								<span className="filter-label-text">
									<Search size={14} /> Pod ID
								</span>
								<input
									type="text"
									placeholder="Search by Pod ID (e.g., 201)"
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										resetPage();
									}}
									className={`filter-input ${
										search ? "filter-input--active" : ""
									}`}
								/>
							</label>
						</div>

						<div className="filter-group">
							<label className="filter-label">
								<span className="filter-label-text">Floor</span>
								<select
									value={filterFloor}
									onChange={(e) => {
										setFilterFloor(e.target.value as "" | PodFloor);
										resetPage();
									}}
									className={`filter-input ${
										filterFloor ? "filter-input--active" : ""
									}`}
								>
									<option value="">All Floors</option>
									<option value="women-only">Women-Only</option>
									<option value="men-only">Men-Only</option>
									<option value="couples">Couples</option>
									<option value="business">Business</option>
								</select>
							</label>
						</div>

						<div className="filter-group">
							<label className="filter-label">
								<span className="filter-label-text">Status</span>
								<select
									value={filterStatus}
									onChange={(e) => {
										setFilterStatus(e.target.value as "" | Room["status"]);
										resetPage();
									}}
									className={`filter-input ${
										filterStatus ? "filter-input--active" : ""
									}`}
								>
									<option value="">All Statuses</option>
									<option value="available">Available</option>
									<option value="reserved">Reserved</option>
									<option value="occupied">Occupied</option>
									<option value="maintenance">Maintenance</option>
								</select>
							</label>
						</div>

						{(tab === "booked" || tab === "floor") && (
							<>
								<div className="filter-group">
									<label className="filter-label">
										<span className="filter-label-text">
											<Calendar size={14} /> Start Date
										</span>
										<DatePicker
											selected={startDate ? new Date(startDate) : null}
											onChange={(date: Date | null) => {
												setStartDate(
													date ? date.toISOString().split("T")[0] : ""
												);
												resetPage();
											}}
											dateFormat="MMM d, yyyy"
											className={`filter-input ${
												startDate ? "filter-input--active" : ""
											}`}
											placeholderText="Select start date"
										/>
									</label>
								</div>

								<div className="filter-group">
									<label className="filter-label">
										<span className="filter-label-text">
											<Calendar size={14} /> End Date
										</span>
										<DatePicker
											selected={endDate ? new Date(endDate) : null}
											onChange={(date: Date | null) => {
												setEndDate(
													date ? date.toISOString().split("T")[0] : ""
												);
												resetPage();
											}}
											minDate={startDate ? new Date(startDate) : undefined}
											dateFormat="MMM d, yyyy"
											className={`filter-input ${
												endDate ? "filter-input--active" : ""
											}`}
											placeholderText="Select end date"
										/>
									</label>
								</div>
							</>
						)}

						<RoleGuard requiredRoles="admin">
							<div className="filter-group filter-group--action">
								<label className="filter-label">
									<span className="filter-label-text">Actions</span>
									<button
										onClick={() => setShowForm(!showForm)}
										className="filter-input filter-input--button"
									>
										{showForm ? "Cancel" : "+ Add New Room"}
									</button>
								</label>
							</div>
						</RoleGuard>
					</div>
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
													: r.roomId && r.roomId._id === room._id
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
													<RoleGuard requiredRoles="admin">
														<button onClick={() => handleEdit(room)}>
															Edit
														</button>
													</RoleGuard>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}

						{/* Pagination for Booked Rooms */}
						{allBookedRooms.length > 0 && (
							<Pagination
								currentPage={currentPage}
								totalPages={bookedTotalPages}
								onPageChange={setCurrentPage}
								totalItems={allBookedRooms.length}
								itemsPerPage={itemsPerPage}
								onItemsPerPageChange={setItemsPerPage}
							/>
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
									{paginatedAllRooms.map((room: Room) => (
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
												{room.offering?.basePrice
													? formatMoney(room.offering.basePrice)
													: formatMoney(0)}
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
												<RoleGuard requiredRoles="admin">
													<button onClick={() => handleEdit(room)}>Edit</button>
													<button
														onClick={() => handleDelete(room._id)}
														className="delete"
													>
														Delete
													</button>
												</RoleGuard>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}

						{/* Pagination for All Rooms */}
						{filteredRooms.length > 0 && (
							<Pagination
								currentPage={currentPage}
								totalPages={allRoomsTotalPages}
								onPageChange={setCurrentPage}
								totalItems={filteredRooms.length}
								itemsPerPage={itemsPerPage}
								onItemsPerPageChange={setItemsPerPage}
							/>
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
