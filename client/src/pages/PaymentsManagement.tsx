import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
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

	const { data: payments = [], isLoading: paymentsLoading } =
		useGetPaymentsQuery({
			dateFrom,
			dateTo,
			status: statusFilter,
			limit: 100,
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

	const formatCurrency = (cents: number) => {
		return `$${(cents / 100).toFixed(2)}`;
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
								<input
									type="date"
									value={dateFrom}
									onChange={(e) => setDateFrom(e.target.value)}
								/>
							</div>
							<div className="filter-group">
								<label>To Date:</label>
								<input
									type="date"
									value={dateTo}
									onChange={(e) => setDateTo(e.target.value)}
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
								<h2>Monthly Revenue</h2>
								<table>
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
											{payments.map((payment) => (
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
																backgroundColor: getStatusColor(payment.status),
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
									<div className="list-items">
										{payments.map((payment) => (
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
