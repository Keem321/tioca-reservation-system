import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { AppDispatch } from "../store";
import type { PaymentRoomInfo, PaymentAmenityInfo } from "../types/payment";
import {
	useGetPaymentsQuery,
	useGetPaymentStatsQuery,
	useGetRevenueReportQuery,
	useProcessRefundMutation,
	useUpdatePaymentMutation,
	useGetPaymentHistoryQuery,
} from "../features/paymentsApi";
import { paymentsApi } from "../features/paymentsApi";
import Navbar from "../components/landing/Navbar";
import RoleGuard from "../components/RoleGuard";
import Pagination from "../components/Pagination";
import { useFormatMoney } from "../hooks/useFormatMoney";
import "./PaymentsManagement.css";
import { useToast } from "../components/useToast";

type Tab = "reports" | "management";

export default function PaymentsManagement() {
	const dispatch = useDispatch<AppDispatch>();
	const toast = useToast();
	const [activeTab, setActiveTab] = useState<Tab>("reports");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
		null
	);
	const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState({
		description: "",
		reason: "",
	});

	// Pagination state for management tab
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Pagination state for transaction history (reports tab)
	const [transactionPage, setTransactionPage] = useState(1);
	const [transactionItemsPerPage, setTransactionItemsPerPage] = useState(10);

	// Tooltip state for revenue chart
	const [tooltip, setTooltip] = useState<{
		visible: boolean;
		x: number;
		y: number;
		date: string;
		amount: number;
		count: number;
	} | null>(null);

	// Selected month for chart filtering
	const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

	const { data: payments = [], isLoading: paymentsLoading } =
		useGetPaymentsQuery({
			dateFrom,
			dateTo,
			status: statusFilter,
			limit: 100,
		});

	// Get ALL payments for the chart visualization (not filtered by dates)
	const { data: allPayments = [] } = useGetPaymentsQuery({
		status: "succeeded",
		limit: 1000,
	});

	const { data: stats } = useGetPaymentStatsQuery({
		dateFrom,
		dateTo,
		status: statusFilter,
	});

	const { data: revenueReport = [] } = useGetRevenueReportQuery();
	const [processRefund] = useProcessRefundMutation();
	const [updatePayment] = useUpdatePaymentMutation();
	const { data: paymentHistory = [], refetch: refetchHistory } =
		useGetPaymentHistoryQuery(selectedPaymentId || "", {
			skip: !selectedPaymentId,
		});

	// Pagination calculations for management tab
	const totalPages = Math.ceil(payments.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedPayments = payments.slice(startIndex, endIndex);

	// Pagination calculations for transaction history (reports tab)
	const transactionTotalPages = Math.ceil(
		payments.length / transactionItemsPerPage
	);
	const transactionStartIndex = (transactionPage - 1) * transactionItemsPerPage;
	const transactionEndIndex = transactionStartIndex + transactionItemsPerPage;
	const paginatedTransactions = payments.slice(
		transactionStartIndex,
		transactionEndIndex
	);

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1);
		setTransactionPage(1);
	}, [dateFrom, dateTo, statusFilter]);

	const handleRefund = async (reservationId: string) => {
		if (!window.confirm("Are you sure you want to refund this payment?")) {
			return;
		}

		let patchResult: { undo: () => void } | undefined;
		try {
			// Optimistic update: mark the payment as refunded in the current list
			patchResult = dispatch(
				paymentsApi.util.updateQueryData(
					"getPayments",
					{ dateFrom, dateTo, status: statusFilter, limit: 100 },
					(draft) => {
						const idx = draft.findIndex(
							(p) => p.reservationId?._id === reservationId
						);
						if (idx !== -1) {
							draft[idx].status = "refunded";
						}
					}
				)
			) as unknown as { undo: () => void };
			await processRefund({ reservationId }).unwrap();
			toast.success("Refund processed successfully");
			// No need to undo on success; cache will also be invalidated
		} catch (error) {
			// Roll back optimistic update on error
			if (patchResult) {
				try {
					patchResult.undo();
				} catch (e) {
					console.debug("Refund optimistic rollback failed", e);
				}
			}
			toast.error(`Failed to process refund: ${error}`);
		}
	};

	const handleEditPayment = (payment: {
		_id: string;
		description?: string;
	}) => {
		setEditingPaymentId(payment._id);
		setEditForm({
			description: payment.description || "",
			reason: "",
		});
	};

	const handleSaveEdit = async () => {
		if (!editingPaymentId) return;

		let patchResult: { undo: () => void } | undefined;
		try {
			// Optimistic update: update description in payments list
			patchResult = dispatch(
				paymentsApi.util.updateQueryData(
					"getPayments",
					{ dateFrom, dateTo, status: statusFilter, limit: 100 },
					(draft) => {
						const idx = draft.findIndex((p) => p._id === editingPaymentId);
						if (idx !== -1) {
							// Description update handled by server
						}
					}
				)
			) as unknown as { undo: () => void };
			await updatePayment({
				paymentId: editingPaymentId,
				description: editForm.description,
				reason: editForm.reason,
			}).unwrap();
			toast.success("Payment updated successfully");
			setEditingPaymentId(null);
			setEditForm({ description: "", reason: "" });
			// Refresh history for the selected payment to reflect new edit
			try {
				await refetchHistory();
			} catch (e) {
				console.debug("History refetch failed", e);
			}
		} catch (error) {
			// Roll back optimistic update on error
			if (patchResult) {
				try {
					patchResult.undo();
				} catch (e) {
					console.debug("Edit optimistic rollback failed", e);
				}
			}
			toast.error(`Failed to update payment: ${error}`);
		}
	};

	const { formatMoney } = useFormatMoney();

	const formatCurrency = (cents: number) => {
		return formatMoney(cents);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "succeeded":
				return "#10b981";
			case "failed":
				return "#ef4444";
			case "pending":
				return "#f59e0b";
			case "refunded":
				return "#6b7280";
			default:
				return "#8b5cf6";
		}
	};

	return (
		<>
			<Navbar />
			<div className="payments-management-container">
				<h1>Payments Management</h1>

				{/* Tabs */}
				<div className="tabs">
					<button
						className={`tab ${activeTab === "reports" ? "tab--active" : ""}`}
						onClick={() => setActiveTab("reports")}
					>
						Payment Reports
					</button>
					<button
						className={`tab ${activeTab === "management" ? "tab--active" : ""}`}
						onClick={() => setActiveTab("management")}
					>
						Payment Management
					</button>
				</div>

				{/* Reports Tab */}
				{activeTab === "reports" && (
					<div className="tab-content">
						{/* Filters */}
						<div className="reports-filters">
							<div className="filter-group">
								<label>From Date:</label>
								<DatePicker
									selected={dateFrom ? new Date(dateFrom) : null}
									onChange={(date: Date | null) =>
										setDateFrom(date ? date.toISOString().split("T")[0] : "")
									}
									dateFormat="MMM d, yyyy"
									className="payments-management__datepicker"
									placeholderText="Select start date"
									isClearable
								/>
							</div>
							<div className="filter-group">
								<label>To Date:</label>
								<DatePicker
									selected={dateTo ? new Date(dateTo) : null}
									onChange={(date: Date | null) =>
										setDateTo(date ? date.toISOString().split("T")[0] : "")
									}
									minDate={dateFrom ? new Date(dateFrom) : undefined}
									dateFormat="MMM d, yyyy"
									className="payments-management__datepicker"
									placeholderText="Select end date"
									isClearable
								/>
							</div>
							<div className="filter-group">
								<label>Status:</label>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
								>
									<option value="">All Statuses</option>
									<option value="succeeded">Succeeded</option>
									<option value="failed">Failed</option>
									<option value="pending">Pending</option>
									<option value="refunded">Refunded</option>
								</select>
							</div>
						</div>

						{/* Stats Cards - Only show when no specific status is selected */}
						{!statusFilter && stats && (
							<div className="stats-grid">
								<div className="stat-card">
									<div className="stat-label">
										{dateFrom || dateTo
											? "Total Revenue (Filtered)"
											: "Total Revenue (All Time)"}
									</div>
									<div className="stat-value">
										{formatCurrency(stats.totalRevenue)}
									</div>
								</div>
								<div className="stat-card">
									<div className="stat-label">
										{dateFrom || dateTo
											? "Total Transactions (Filtered)"
											: "Total Transactions (All Time)"}
									</div>
									<div className="stat-value">{stats.totalCount}</div>
								</div>

								{stats.byStatus.succeeded && (
									<div className="stat-card">
										<div className="stat-label">Successful Payments</div>
										<div className="stat-value">
											{stats.byStatus.succeeded.count}
										</div>
										<div className="stat-amount">
											{formatCurrency(stats.byStatus.succeeded.amount)}
										</div>
									</div>
								)}
								{stats.byStatus.failed && (
									<div className="stat-card failed">
										<div className="stat-label">Failed Payments</div>
										<div className="stat-value">
											{stats.byStatus.failed.count}
										</div>
										<div className="stat-amount">
											{formatCurrency(stats.byStatus.failed.amount)}
										</div>
									</div>
								)}
								{stats.byStatus.pending && (
									<div className="stat-card pending">
										<div className="stat-label">Pending Payments</div>
										<div className="stat-value">
											{stats.byStatus.pending.count}
										</div>
										<div className="stat-amount">
											{formatCurrency(stats.byStatus.pending.amount)}
										</div>
									</div>
								)}
							</div>
						)}

						{/* Monthly Revenue Report */}
						{revenueReport.length > 0 && (
							<div className="revenue-report">
								<h2>Daily Revenue by Month</h2>

								{/* Daily Bar Chart Visualization */}
								<div className="revenue-chart">
									{(() => {
										// Calculate daily revenue from ALL payments (not filtered by date)
										const dailyRevenue = new Map<
											string,
											{
												amount: number;
												count: number;
												month: string;
												year: number;
											}
										>();

										// Debug: log payment data
										console.log(
											"Total payments for chart:",
											allPayments.length
										);
										console.log(
											"Succeeded payments:",
											allPayments.filter((p) => p.status === "succeeded").length
										);

										allPayments.forEach((payment) => {
											if (payment.status === "succeeded") {
												const date = new Date(payment.createdAt);
												const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
												const monthKey = `${date.getFullYear()}-${String(
													date.getMonth() + 1
												).padStart(2, "0")}`;

												if (!dailyRevenue.has(dateKey)) {
													dailyRevenue.set(dateKey, {
														amount: 0,
														count: 0,
														month: monthKey,
														year: date.getFullYear(),
													});
												}
												const day = dailyRevenue.get(dateKey)!;
												day.amount += payment.amount;
												day.count += 1;
											}
										});

										// Sort by date
										const sortedDays = Array.from(dailyRevenue.entries()).sort(
											([a], [b]) => a.localeCompare(b)
										);

										console.log("Daily revenue entries:", sortedDays.length);
										console.log("Sample days:", sortedDays.slice(0, 5));

										if (sortedDays.length === 0) {
											return (
												<div style={{ padding: "2rem", textAlign: "center" }}>
													<p
														style={{
															fontSize: "1rem",
															color: "var(--color-text-secondary)",
														}}
													>
														No successful payment data available for
														visualization.
													</p>
													<p
														style={{
															fontSize: "0.875rem",
															color: "var(--color-text-secondary)",
															marginTop: "0.5rem",
														}}
													>
														Total payments: {allPayments.length} | Succeeded:{" "}
														{
															allPayments.filter(
																(p) => p.status === "succeeded"
															).length
														}
													</p>
												</div>
											);
										}

										// Group by month for coloring
										const monthGroups = new Map<
											string,
											Array<
												[
													string,
													{
														amount: number;
														count: number;
														month: string;
														year: number;
													},
												]
											>
										>();
										sortedDays.forEach((entry) => {
											const [_, data] = entry;
											if (!monthGroups.has(data.month)) {
												monthGroups.set(data.month, []);
											}
											monthGroups.get(data.month)!.push(entry);
										});

										// Auto-select the most recent month if none selected
										if (!selectedMonth && monthGroups.size > 0) {
											const latestMonth = Array.from(monthGroups.keys())
												.sort()
												.reverse()[0];
											setSelectedMonth(latestMonth);
										}

										// Filter to selected month only
										const filteredDays = selectedMonth
											? sortedDays.filter(
													([_, data]) => data.month === selectedMonth
												)
											: [];

										// Generate all days for the selected month
										const allDaysInMonth: Array<
											[
												string,
												{
													amount: number;
													count: number;
													month: string;
													year: number;
												},
											]
										> = [];
										if (selectedMonth) {
											const [year, month] = selectedMonth
												.split("-")
												.map(Number);
											const daysInMonth = new Date(year, month, 0).getDate(); // Get number of days in month

											// Create revenue map for quick lookup
											const revenueMap = new Map(filteredDays);

											// Generate all days
											for (let day = 1; day <= daysInMonth; day++) {
												const dateKey = `${year}-${String(month).padStart(
													2,
													"0"
												)}-${String(day).padStart(2, "0")}`;

												if (revenueMap.has(dateKey)) {
													allDaysInMonth.push([
														dateKey,
														revenueMap.get(dateKey)!,
													]);
												} else {
													// Add placeholder for days with no data
													allDaysInMonth.push([
														dateKey,
														{
															amount: 0,
															count: 0,
															month: selectedMonth,
															year: year,
														},
													]);
												}
											}
										}

										// Calculate max revenue for the filtered month only (excluding days with no data)
										const maxRevenue =
											filteredDays.length > 0
												? Math.max(
														...filteredDays.map(([_, data]) => data.amount)
													)
												: 1; // Avoid division by zero

										// Color palette for different months
										const monthColors = [
											"#bc8f67",
											"#a86434",
											"#8b6f47",
											"#d4a574",
											"#9b7e5a",
											"#c99b6e",
											"#b5825c",
											"#a77644",
											"#d8b088",
											"#8a6841",
										];

										const monthIndex = selectedMonth
											? Array.from(monthGroups.keys()).indexOf(selectedMonth)
											: 0;
										const barColor =
											monthColors[monthIndex % monthColors.length];

										return (
											<>
												<div className="revenue-chart__bars-container">
													<div className="revenue-chart__bars">
														{allDaysInMonth.map(([dateKey, data]) => {
															const date = new Date(dateKey);
															const hasData = data.amount > 0;

															let displayHeight;
															if (!hasData) {
																// Show minimal bar for days with no data
																displayHeight = 3;
															} else {
																// Better scaling: use a minimum base height and scale the rest
																// This ensures small differences are visible
																const minHeight = 15; // minimum 15% height
																const scalableRange = 85; // remaining 85% for scaling
																const scaledHeight =
																	(data.amount / maxRevenue) * scalableRange;
																displayHeight = minHeight + scaledHeight;
															}

															return (
																<div
																	key={dateKey}
																	className="revenue-chart__bar-wrapper"
																>
																	<div className="revenue-chart__bar-container">
																		<div
																			className={`revenue-chart__bar revenue-chart__bar--daily ${
																				!hasData
																					? "revenue-chart__bar--empty"
																					: ""
																			}`}
																			style={{
																				height: `${displayHeight}%`,
																				backgroundColor: hasData
																					? barColor
																					: "rgba(188, 143, 103, 0.15)",
																			}}
																			onMouseEnter={(e) => {
																				if (hasData) {
																					const rect =
																						e.currentTarget.getBoundingClientRect();
																					setTooltip({
																						visible: true,
																						x: rect.left + rect.width / 2,
																						y: rect.top - 10,
																						date: date.toLocaleDateString(
																							"en-US",
																							{
																								month: "short",
																								day: "numeric",
																								year: "numeric",
																							}
																						),
																						amount: data.amount,
																						count: data.count,
																					});
																				}
																			}}
																			onMouseLeave={() => setTooltip(null)}
																		></div>
																	</div>
																	<div className="revenue-chart__label revenue-chart__label--daily">
																		{date.getDate()}
																	</div>
																</div>
															);
														})}
													</div>

													{/* Custom Tooltip */}
													{tooltip && (
														<div
															className="revenue-chart__tooltip"
															style={{
																position: "fixed",
																left: `${tooltip.x}px`,
																top: `${tooltip.y}px`,
																transform: "translate(-50%, -100%)",
															}}
														>
															<div className="revenue-chart__tooltip-date">
																{tooltip.date}
															</div>
															<div className="revenue-chart__tooltip-amount">
																{formatCurrency(tooltip.amount)}
															</div>
															<div className="revenue-chart__tooltip-count">
																{tooltip.count} transaction
																{tooltip.count !== 1 ? "s" : ""}
															</div>
														</div>
													)}
												</div>

												{/* Month Legend */}
												<div className="revenue-chart__legend">
													<div className="revenue-chart__legend-title">
														Hover over a month to view daily breakdown:
													</div>
													<div className="revenue-chart__legend-items">
														{Array.from(monthGroups.keys())
															.sort()
															.reverse()
															.map((monthKey) => {
																const [year, month] = monthKey.split("-");
																const date = new Date(
																	parseInt(year),
																	parseInt(month) - 1
																);
																const actualIndex = Array.from(
																	monthGroups.keys()
																).indexOf(monthKey);
																const monthColor =
																	monthColors[actualIndex % monthColors.length];
																const monthData = monthGroups.get(monthKey)!;
																const monthTotal = monthData.reduce(
																	(sum, [_, data]) => sum + data.amount,
																	0
																);
																const isSelected = selectedMonth === monthKey;

																return (
																	<div
																		key={monthKey}
																		className={`revenue-chart__legend-item ${
																			isSelected
																				? "revenue-chart__legend-item--active"
																				: ""
																		}`}
																		onMouseEnter={() =>
																			setSelectedMonth(monthKey)
																		}
																	>
																		<div
																			className="revenue-chart__legend-color"
																			style={{ backgroundColor: monthColor }}
																		/>
																		<span className="revenue-chart__legend-label">
																			{date.toLocaleDateString("en-US", {
																				month: "long",
																				year: "numeric",
																			})}
																		</span>
																		<span className="revenue-chart__legend-value">
																			{formatCurrency(monthTotal)}
																		</span>
																	</div>
																);
															})}
													</div>
												</div>
											</>
										);
									})()}
								</div>

								<table className="revenue-summary-table">
									<thead>
										<tr>
											<th>Month</th>
											<th>Transactions</th>
											<th>Avg Amount</th>
											<th>Total Revenue</th>
										</tr>
									</thead>
									<tbody>
										{revenueReport.map((report) => (
											<tr key={`${report._id.year}-${report._id.month}`}>
												<td>
													{new Date(
														report._id.year,
														report._id.month - 1
													).toLocaleDateString("en-US", {
														month: "long",
														year: "numeric",
													})}
												</td>
												<td>{report.count}</td>
												<td>{formatCurrency(report.avgAmount)}</td>
												<td>
													<strong>{formatCurrency(report.totalRevenue)}</strong>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}

						{/* Transaction History */}
						<div className="transaction-history">
							<h2>Transaction History</h2>
							{paymentsLoading ? (
								<p>Loading payments...</p>
							) : payments.length === 0 ? (
								<p>No payments found</p>
							) : (
								<>
									<div className="table-wrapper">
										<table className="payments-table">
											<thead>
												<tr>
													<th>Date</th>
													<th>Guest</th>
													<th>Email</th>
													<th>Amount</th>
													<th>Status</th>
													<th>Receipt</th>
													<th>Action</th>
												</tr>
											</thead>
											<tbody>
												{paginatedTransactions.map((payment) => (
													<tr key={payment._id}>
														<td>{formatDate(payment.createdAt)}</td>
														<td>{payment.reservationId?.guestName || "-"}</td>
														<td>{payment.reservationId?.guestEmail || "-"}</td>
														<td className="amount">
															{formatCurrency(payment.amount)}
														</td>
														<td>
															<span
																className="status-badge"
																style={{
																	backgroundColor: getStatusColor(
																		payment.status
																	),
																}}
															>
																{payment.status}
															</span>
														</td>
														<td>
															{payment.receiptUrl ? (
																<a
																	href={payment.receiptUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="receipt-link"
																>
																	View
																</a>
															) : (
																"-"
															)}
														</td>
														<td>
															{payment.status === "succeeded" && (
																<RoleGuard requiredRoles="admin">
																	<button
																		onClick={() =>
																			handleRefund(payment.reservationId._id)
																		}
																		className="btn-refund"
																	>
																		Refund
																	</button>
																</RoleGuard>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
									<Pagination
										currentPage={transactionPage}
										totalPages={transactionTotalPages}
										onPageChange={setTransactionPage}
										totalItems={payments.length}
										itemsPerPage={transactionItemsPerPage}
										onItemsPerPageChange={setTransactionItemsPerPage}
									/>
								</>
							)}
						</div>
					</div>
				)}

				{/* Management Tab */}
				{activeTab === "management" && (
					<div className="tab-content">
						<div className="management-layout">
							{/* Payments List */}
							<div className="payments-list">
								<h2>Payments</h2>
								{paymentsLoading ? (
									<p>Loading payments...</p>
								) : payments.length === 0 ? (
									<p>No payments found</p>
								) : (
									<>
										<div className="list-items">
											{paginatedPayments.map((payment) => (
												<div
													key={payment._id}
													className={`list-item ${
														selectedPaymentId === payment._id
															? "list-item--selected"
															: ""
													}`}
													onClick={() => setSelectedPaymentId(payment._id)}
												>
													<div className="list-item__header">
														<strong>
															{payment.reservationId?.guestName || "Unknown"}
														</strong>
														<span
															className="status-badge"
															style={{
																backgroundColor: getStatusColor(payment.status),
															}}
														>
															{payment.status}
														</span>
													</div>
													<div className="list-item__details">
														<div>{formatCurrency(payment.amount)}</div>
														<div className="text-muted">
															{formatDate(payment.createdAt)}
														</div>
													</div>
												</div>
											))}
										</div>
										<Pagination
											currentPage={currentPage}
											totalPages={totalPages}
											onPageChange={setCurrentPage}
											totalItems={payments.length}
											itemsPerPage={itemsPerPage}
											onItemsPerPageChange={setItemsPerPage}
										/>
									</>
								)}
							</div>

							{/* Payment Details & Edit */}
							{selectedPaymentId && payments && (
								<div className="payment-details">
									{(() => {
										const payment = payments.find(
											(p) => p._id === selectedPaymentId
										);
										if (!payment) return null;

										return (
											<div>
												<h2>Payment Details</h2>
												<div className="details-grid">
													<div className="detail-row">
														<label>Status:</label>
														<span
															className="status-badge"
															style={{
																backgroundColor: getStatusColor(payment.status),
															}}
														>
															{payment.status}
														</span>
													</div>
													<div className="detail-row">
														<label>Amount:</label>
														<span className="amount">
															{formatCurrency(payment.amount)}
														</span>
													</div>
													<div className="detail-row">
														<label>Guest:</label>
														<span>{payment.reservationId?.guestName}</span>
													</div>
													<div className="detail-row">
														<label>Email:</label>
														<span>{payment.reservationId?.guestEmail}</span>
													</div>
													<div className="detail-row">
														<label>Check-in:</label>
														<span>
															{formatDate(payment.reservationId?.checkInDate)}
														</span>
													</div>
													<div className="detail-row">
														<label>Check-out:</label>
														<span>
															{formatDate(payment.reservationId?.checkOutDate)}
														</span>
													</div>
													{/* Reservation Details */}
													{(() => {
														// Debug logging
														console.log(
															"Payment reservation details:",
															payment.reservationDetails
														);
														console.log("Payment ID:", payment._id);

														return (
															payment.reservationDetails && (
																<div className="reservation-details-section">
																	<h3>Reservation Details</h3>

																	<div className="reservation-details-grid">
																		{/* Basic Info */}
																		<div className="details-subsection">
																			<h4>Stay Information</h4>
																			<div className="details-grid">
																				<div className="detail-row">
																					<label>Duration:</label>
																					<span>
																						{
																							payment.reservationDetails
																								.numberOfNights
																						}{" "}
																						night
																						{payment.reservationDetails
																							.numberOfNights > 1
																							? "s"
																							: ""}
																					</span>
																				</div>
																				<div className="detail-row">
																					<label>Guests:</label>
																					<span>
																						{
																							payment.reservationDetails
																								.numberOfGuests
																						}
																					</span>
																				</div>
																				<div className="detail-row">
																					<label>Special Requests:</label>
																					<span>
																						{payment.reservationDetails
																							.specialRequests || "-"}
																					</span>
																				</div>
																			</div>
																		</div>

																		{/* Rooms */}
																		<div className="details-subsection">
																			<h4>Rooms Booked</h4>
																			<div className="details-grid">
																				{payment.reservationDetails?.rooms &&
																				payment.reservationDetails.rooms
																					.length > 0 ? (
																					payment.reservationDetails.rooms.map(
																						(
																							room: PaymentRoomInfo,
																							idx: number
																						) => (
																							<div
																								key={`room-${idx}`}
																								className="detail-row"
																							>
																								<label>Pod {idx + 1}:</label>
																								<span>
																									{room.podId ? (
																										`${room.podId} - ${
																											room.quality
																										} (${room.floor}) @ ${
																											room.basePrice != null
																												? `$${(
																														room.basePrice / 100
																													).toFixed(2)}/night`
																												: "Price N/A"
																										}`
																									) : (
																										<>
																											<span
																												style={{
																													color: "#999",
																												}}
																											>
																												Details incomplete
																												-{" "}
																											</span>
																											Room ID:{" "}
																											{room.roomId
																												? String(
																														room.roomId
																													).slice(-8)
																												: "Unknown"}{" "}
																											@ $
																											{room.basePrice != null
																												? `$${(
																														room.basePrice / 100
																													).toFixed(2)}/night`
																												: "N/A"}
																										</>
																									)}
																								</span>
																							</div>
																						)
																					)
																				) : (
																					<div className="detail-row">
																						<label>Status:</label>
																						<span
																							style={{
																								color: "#999",
																								fontStyle: "italic",
																							}}
																						>
																							Room details not captured (legacy
																							payment - created before detailed
																							tracking)
																						</span>
																					</div>
																				)}
																			</div>
																		</div>

																		{/* Amenities */}
																		<div className="details-subsection">
																			<h4>Amenities</h4>
																			<div className="details-grid">
																				{payment.reservationDetails
																					?.selectedAmenities &&
																				payment.reservationDetails
																					.selectedAmenities.length > 0 ? (
																					payment.reservationDetails.selectedAmenities.map(
																						(
																							amenity: PaymentAmenityInfo,
																							idx: number
																						) => (
																							<div
																								key={idx}
																								className="detail-row"
																							>
																								<label>{amenity.name}:</label>
																								<span>
																									{amenity.price != null
																										? `$${(
																												amenity.price / 100
																											).toFixed(2)}`
																										: "N/A"}{" "}
																									({amenity.priceType || "N/A"})
																									{amenity.priceType ===
																										"per-night" &&
																										amenity.totalPrice !=
																											null &&
																										payment.reservationDetails
																											?.numberOfNights &&
																										` × ${
																											payment.reservationDetails
																												.numberOfNights
																										} = $${(
																											amenity.totalPrice / 100
																										).toFixed(2)}`}
																								</span>
																							</div>
																						)
																					)
																				) : (
																					<div className="detail-row">
																						<label>Status:</label>
																						<span
																							style={{ fontStyle: "italic" }}
																						>
																							None selected
																						</span>
																					</div>
																				)}
																			</div>
																		</div>

																		{/* Price Breakdown */}
																		<div className="details-subsection">
																			<h4>Price Breakdown</h4>
																			<div className="details-grid">
																				{payment.reservationDetails
																					.priceBreakdown ? (
																					<>
																						<div className="detail-row">
																							<label>Room Total:</label>
																							<span>
																								{payment.reservationDetails
																									.priceBreakdown
																									.baseRoomTotal != null
																									? formatCurrency(
																											payment.reservationDetails
																												.priceBreakdown
																												.baseRoomTotal
																										)
																									: "$0.00"}
																							</span>
																						</div>
																						{payment.reservationDetails
																							.priceBreakdown.amenitiesTotal !=
																							null &&
																							payment.reservationDetails
																								.priceBreakdown.amenitiesTotal >
																								0 && (
																								<div className="detail-row">
																									<label>Amenities:</label>
																									<span>
																										{formatCurrency(
																											payment.reservationDetails
																												.priceBreakdown
																												.amenitiesTotal
																										)}
																									</span>
																								</div>
																							)}
																						{payment.reservationDetails
																							.priceBreakdown.taxes != null &&
																							payment.reservationDetails
																								.priceBreakdown.taxes > 0 && (
																								<div className="detail-row">
																									<label>Taxes:</label>
																									<span>
																										{formatCurrency(
																											payment.reservationDetails
																												.priceBreakdown.taxes
																										)}
																									</span>
																								</div>
																							)}
																						{payment.reservationDetails
																							.priceBreakdown.discounts !=
																							null &&
																							payment.reservationDetails
																								.priceBreakdown.discounts >
																								0 && (
																								<div className="detail-row">
																									<label>Discounts:</label>
																									<span>
																										{formatCurrency(
																											payment.reservationDetails
																												.priceBreakdown
																												.discounts
																										)}
																									</span>
																								</div>
																							)}
																						<div className="detail-row detail-row--total">
																							<label>Total:</label>
																							<span>
																								{payment.reservationDetails
																									.priceBreakdown.total != null
																									? formatCurrency(
																											payment.reservationDetails
																												.priceBreakdown.total
																										)
																									: formatCurrency(
																											payment.amount
																										)}
																							</span>
																						</div>
																					</>
																				) : (
																					<div className="detail-row">
																						<label>Total:</label>
																						<span>
																							{formatCurrency(payment.amount)}
																						</span>
																					</div>
																				)}
																			</div>
																		</div>

																		{/* Stripe Payment IDs */}
																		<div className="details-subsection">
																			<h4>Payment IDs</h4>
																			<div className="details-grid">
																				<div className="detail-row">
																					<label>Stripe Intent ID:</label>
																					<span className="monospace">
																						{payment.stripePaymentIntentId}
																					</span>
																				</div>
																				{payment.stripeChargeId && (
																					<div className="detail-row">
																						<label>Charge ID:</label>
																						<span className="monospace">
																							{payment.stripeChargeId}
																						</span>
																					</div>
																				)}
																			</div>
																		</div>
																	</div>
																</div>
															)
														);
													})()}{" "}
												</div>

												{/* Edit Form */}
												{editingPaymentId === payment._id ? (
													<div className="edit-form">
														<h3>Edit Payment</h3>
														<div className="form-group">
															<label>Description:</label>
															<textarea
																value={editForm.description}
																onChange={(e) =>
																	setEditForm({
																		...editForm,
																		description: e.target.value,
																	})
																}
																rows={3}
															/>
														</div>
														<div className="form-group">
															<label>Edit Reason (optional):</label>
															<input
																type="text"
																value={editForm.reason}
																onChange={(e) =>
																	setEditForm({
																		...editForm,
																		reason: e.target.value,
																	})
																}
																placeholder="Why are you making this edit?"
															/>
														</div>
														<div className="form-actions">
															<button
																onClick={handleSaveEdit}
																className="btn-save"
															>
																Save Changes
															</button>
															<button
																onClick={() => setEditingPaymentId(null)}
																className="btn-cancel"
															>
																Cancel
															</button>
														</div>
													</div>
												) : (
													<button
														onClick={() => handleEditPayment(payment)}
														className="btn-edit"
													>
														Edit Payment
													</button>
												)}

												{/* Edit History */}
												{paymentHistory.length > 0 && (
													<div className="edit-history">
														<h3>Edit History</h3>
														<div className="history-items">
															{paymentHistory.map((edit) => (
																<div key={edit._id} className="history-item">
																	<div className="history-header">
																		<strong>{edit.editedByName}</strong>
																		<span className="timestamp">
																			{formatDateTime(edit.createdAt)}
																		</span>
																	</div>
																	<div className="history-content">
																		<div className="field-name">
																			{edit.fieldName}
																		</div>
																		{edit.reason && (
																			<div className="reason">
																				Reason: {edit.reason}
																			</div>
																		)}
																		<div className="change">
																			<span className="before">
																				Before:{" "}
																				{JSON.stringify(edit.beforeValue)}
																			</span>
																			<span className="after">
																				After: {JSON.stringify(edit.afterValue)}
																			</span>
																		</div>
																	</div>
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										);
									})()}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
