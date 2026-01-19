import React, { useState, useMemo } from "react";
import {
	useGetAnalyticsSummaryQuery,
	useGetDailyTrendsQuery,
} from "../features/analyticsApi";
import Navbar from "../components/landing/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
	TrendingDown,
	TrendingUp,
	Users,
	CheckCircle,
	Calendar,
	BarChart3,
} from "lucide-react";
import "./Analytics.css";

/**
 * Analytics Dashboard Component
 *
 * Displays booking funnel analytics including bounce rates
 * for each stage of the booking process.
 *
 * Available to managers only.
 */
const Analytics: React.FC = () => {
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);

	// Format dates for API
	const dateRange = useMemo(
		() => ({
			startDate: startDate ? startDate.toISOString().split("T")[0] : undefined,
			endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
		}),
		[startDate, endDate]
	);

	const {
		data: summaryData,
		isLoading,
		error,
	} = useGetAnalyticsSummaryQuery(dateRange);
	const { data: trendsData, isLoading: trendsLoading } =
		useGetDailyTrendsQuery(dateRange);

	// Process all data with hooks BEFORE any early returns
	const metrics = summaryData?.data.metrics || {};
	const overall = summaryData?.data.overall || {
		totalSessions: 0,
		completedPayment: 0,
		conversionRate: 0,
	};

	const stages = useMemo(
		() => [
			{
				key: "search",
				name: "Search",
				description: "Users browsing available rooms",
				icon: Users,
				color: "#d97706", // Warm amber
			},
			{
				key: "confirm",
				name: "Confirmation",
				description: "Users entering booking details",
				icon: CheckCircle,
				color: "#a86434", // TIOCA primary brown
			},
			{
				key: "payment",
				name: "Payment",
				description: "Users completing payment",
				icon: CheckCircle,
				color: "#78350f", // Dark amber-brown (more distinct)
			},
		],
		[]
	);

	// Process trends data for chart
	const trendsChartData = useMemo(() => {
		if (!trendsData?.data) return [];

		const data = trendsData.data;
		const dates = Object.keys(data).sort();

		return dates.map((date) => {
			const dayData = data[date];
			return {
				date: new Date(date).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
				fullDate: date,
				searchEntered: dayData.search?.enter || 0,
				searchCompleted: dayData.search?.complete || 0,
				confirmEntered: dayData.confirm?.enter || 0,
				confirmCompleted: dayData.confirm?.complete || 0,
				paymentEntered: dayData.payment?.enter || 0,
				paymentCompleted: dayData.payment?.complete || 0,
			};
		});
	}, [trendsData]);

	const handleClearDates = () => {
		setStartDate(null);
		setEndDate(null);
	};

	// Render loading state
	if (isLoading) {
		return (
			<>
				<Navbar />
				<div className="analytics-page">
					<div className="analytics-page__container">
						<div className="analytics-page__loading">
							Loading analytics data...
						</div>
					</div>
				</div>
			</>
		);
	}

	// Render error state
	if (error) {
		return (
			<>
				<Navbar />
				<div className="analytics-page">
					<div className="analytics-page__container">
						<div className="analytics-page__error">
							<h2>Error Loading Analytics</h2>
							<p>
								{(error as { data?: { error?: string } })?.data?.error ||
									"Failed to load analytics data. Please try again."}
							</p>
						</div>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<div className="analytics-page">
				<div className="analytics-page__container">
					{/* Header */}
					<div className="analytics-page__header">
						<h1>Booking Analytics</h1>
						<p className="analytics-page__subtitle">
							Track anonymous user behavior through the booking funnel
						</p>
					</div>

					{/* Date Range Filter */}
					<div className="filters">
						<div className="filters__header">
							<div className="filters__header-content">
								<Calendar
									size={24}
									className="filters__icon filters__icon--main"
								/>
								<div>
									<h3 className="filters__title">Date Range</h3>
									<p className="filters__subtitle">
										Filter analytics by date range
									</p>
								</div>
							</div>
						</div>

						<div className="filters__content">
							<div className="filter-row">
								<div className="filter-group">
									<label htmlFor="startDate" className="filter-group__label">
										Start Date
									</label>
									<DatePicker
										selected={startDate}
										onChange={(date: Date | null) => setStartDate(date)}
										selectsStart
										startDate={startDate}
										endDate={endDate}
										maxDate={endDate || new Date()}
										placeholderText="Select start date"
										dateFormat="MMM d, yyyy"
										className="filter-group__datepicker"
									/>
								</div>
								<div className="filter-group">
									<label htmlFor="endDate" className="filter-group__label">
										End Date
									</label>
									<DatePicker
										selected={endDate}
										onChange={(date: Date | null) => setEndDate(date)}
										selectsEnd
										startDate={startDate}
										endDate={endDate}
										minDate={startDate || undefined}
										maxDate={new Date()}
										placeholderText="Select end date"
										dateFormat="MMM d, yyyy"
										className="filter-group__datepicker"
									/>
								</div>
								{(startDate || endDate) && (
									<button
										onClick={handleClearDates}
										className="filter-clear-btn"
									>
										Clear Dates
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Overall Metrics */}
					<div className="analytics-page__overall">
						<div className="metric-card">
							<div className="metric-card__label">Total Sessions</div>
							<div className="metric-card__value">{overall.totalSessions}</div>
						</div>
						<div className="metric-card">
							<div className="metric-card__label">Completed Bookings</div>
							<div className="metric-card__value">
								{overall.completedPayment}
							</div>
						</div>
						<div className="metric-card metric-card--highlight">
							<div className="metric-card__label">Conversion Rate</div>
							<div className="metric-card__value">
								{overall.conversionRate.toFixed(1)}%
							</div>
						</div>
					</div>

					{/* Trends Chart */}
					{!trendsLoading && trendsChartData.length > 0 && (
						<div className="analytics-page__trends">
							<div className="trends-header">
								<BarChart3 size={24} className="trends-icon" />
								<div>
									<h2>Daily Trends</h2>
									<p className="trends-subtitle">User activity over time</p>
								</div>
							</div>
							<div className="trends-chart">
								<div className="chart-legend">
									<div className="legend-item">
										<span
											className="legend-dot"
											style={{ backgroundColor: "#d97706" }}
										></span>
										<span>Search</span>
									</div>
									<div className="legend-item">
										<span
											className="legend-dot"
											style={{ backgroundColor: "#a86434" }}
										></span>
										<span>Confirmation</span>
									</div>
									<div className="legend-item">
										<span
											className="legend-dot"
											style={{ backgroundColor: "#78350f" }}
										></span>
										<span>Payment</span>
									</div>
								</div>
								<div className="chart-container">
									<svg
										className="chart-svg"
										viewBox="0 0 800 300"
										preserveAspectRatio="xMidYMid meet"
									>
										{/* Grid lines */}
										<g className="grid">
											{[0, 25, 50, 75, 100].map((percent) => {
												const y = 250 - (percent / 100) * 200;
												return (
													<g key={percent}>
														<line
															x1="50"
															y1={y}
															x2="750"
															y2={y}
															stroke="#e5e7eb"
															strokeWidth="1"
														/>
														<text
															x="35"
															y={y + 5}
															fontSize="12"
															fill="#6b7280"
															textAnchor="end"
														>
															{percent}
														</text>
													</g>
												);
											})}
										</g>

										{/* Lines */}
										{trendsChartData.length > 1 && (
											<>
												{/* Search line */}
												<polyline
													fill="none"
													stroke="#d97706"
													strokeWidth="3"
													points={trendsChartData
														.map((d, i) => {
															const x =
																50 + (i / (trendsChartData.length - 1)) * 700;
															const maxVal = Math.max(
																...trendsChartData.map((d) =>
																	Math.max(
																		d.searchEntered,
																		d.confirmEntered,
																		d.paymentEntered
																	)
																)
															);
															const y =
																250 - (d.searchEntered / (maxVal || 1)) * 200;
															return `${x},${y}`;
														})
														.join(" ")}
												/>
												{/* Confirm line */}
												<polyline
													fill="none"
													stroke="#a86434"
													strokeWidth="3"
													points={trendsChartData
														.map((d, i) => {
															const x =
																50 + (i / (trendsChartData.length - 1)) * 700;
															const maxVal = Math.max(
																...trendsChartData.map((d) =>
																	Math.max(
																		d.searchEntered,
																		d.confirmEntered,
																		d.paymentEntered
																	)
																)
															);
															const y =
																250 - (d.confirmEntered / (maxVal || 1)) * 200;
															return `${x},${y}`;
														})
														.join(" ")}
												/>
												{/* Payment line */}
												<polyline
													fill="none"
													stroke="#78350f"
													strokeWidth="3"
													points={trendsChartData
														.map((d, i) => {
															const x =
																50 + (i / (trendsChartData.length - 1)) * 700;
															const maxVal = Math.max(
																...trendsChartData.map((d) =>
																	Math.max(
																		d.searchEntered,
																		d.confirmEntered,
																		d.paymentEntered
																	)
																)
															);
															const y =
																250 - (d.paymentEntered / (maxVal || 1)) * 200;
															return `${x},${y}`;
														})
														.join(" ")}
												/>
												{/* Data points */}
												{trendsChartData.map((d, i) => {
													const x =
														50 + (i / (trendsChartData.length - 1)) * 700;
													const maxVal = Math.max(
														...trendsChartData.map((d) =>
															Math.max(
																d.searchEntered,
																d.confirmEntered,
																d.paymentEntered
															)
														)
													);
													return (
														<g key={d.fullDate}>
															<circle
																cx={x}
																cy={
																	250 - (d.searchEntered / (maxVal || 1)) * 200
																}
																r="4"
																fill="#d97706"
															/>
															<circle
																cx={x}
																cy={
																	250 - (d.confirmEntered / (maxVal || 1)) * 200
																}
																r="4"
																fill="#a86434"
															/>
															<circle
																cx={x}
																cy={
																	250 - (d.paymentEntered / (maxVal || 1)) * 200
																}
																r="4"
																fill="#78350f"
															/>
														</g>
													);
												})}
											</>
										)}

										{/* X-axis labels */}
										<g className="x-axis">
											{trendsChartData.map((d, i) => {
												if (trendsChartData.length > 10 && i % 2 !== 0)
													return null;
												const x = 50 + (i / (trendsChartData.length - 1)) * 700;
												return (
													<text
														key={d.fullDate}
														x={x}
														y="275"
														fontSize="12"
														fill="#6b7280"
														textAnchor="middle"
													>
														{d.date}
													</text>
												);
											})}
										</g>
									</svg>
								</div>
							</div>
						</div>
					)}

					{/* Stage-by-Stage Metrics */}
					<div className="analytics-page__stages">
						<h2>Booking Funnel Breakdown</h2>
						<div className="stages-grid">
							{stages.map((stage) => {
								const stageMetrics = metrics[stage.key] || {
									entered: 0,
									bounced: 0,
									completed: 0,
									bounceRate: 0,
									completionRate: 0,
								};

								const Icon = stage.icon;

								return (
									<div key={stage.key} className="stage-card">
										<div className="stage-card__header">
											<Icon
												size={24}
												className="stage-card__icon"
												style={{ color: stage.color }}
											/>
											<div>
												<h3 className="stage-card__title">{stage.name}</h3>
												<p className="stage-card__description">
													{stage.description}
												</p>
											</div>
										</div>

										<div className="stage-card__metrics">
											<div className="stage-metric">
												<div className="stage-metric__label">Entered</div>
												<div className="stage-metric__value">
													{stageMetrics.entered}
												</div>
											</div>
											<div className="stage-metric">
												<div className="stage-metric__label">Completed</div>
												<div className="stage-metric__value stage-metric__value--success">
													{stageMetrics.completed}
												</div>
											</div>
											<div className="stage-metric">
												<div className="stage-metric__label">Bounced</div>
												<div className="stage-metric__value stage-metric__value--danger">
													{stageMetrics.bounced}
												</div>
											</div>
										</div>

										<div className="stage-card__rates">
											<div className="rate-item">
												<div className="rate-item__label">
													<TrendingUp size={16} />
													Completion Rate
												</div>
												<div className="rate-item__value rate-item__value--success">
													{stageMetrics.completionRate.toFixed(1)}%
												</div>
											</div>
											<div className="rate-item">
												<div className="rate-item__label">
													<TrendingDown size={16} />
													Bounce Rate
												</div>
												<div className="rate-item__value rate-item__value--danger">
													{stageMetrics.bounceRate.toFixed(1)}%
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Info Section */}
					<div className="analytics-page__info">
						<h3>About This Data</h3>
						<ul>
							<li>
								<strong>Entered:</strong> Number of unique sessions that reached
								this stage
							</li>
							<li>
								<strong>Completed:</strong> Number of sessions that successfully
								moved to the next stage
							</li>
							<li>
								<strong>Bounced:</strong> Number of sessions that left without
								completing this stage
							</li>
							<li>
								<strong>Bounce Rate:</strong> Percentage of users who left at
								this stage without completing
							</li>
							<li>
								<strong>Completion Rate:</strong> Percentage of users who
								successfully completed this stage
							</li>
						</ul>
						<p className="analytics-page__note">
							All data is anonymous and tracked per browser session. No personal
							information is collected.
						</p>
					</div>
				</div>
			</div>
		</>
	);
};

export default Analytics;
