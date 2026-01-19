import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Use the same configurable base URL pattern as other APIs.
// Falls back to relative /api for prod/static hosting, never to localhost.
const ANALYTICS_BASE_URL = import.meta.env.VITE_API_URL
	? `${import.meta.env.VITE_API_URL}/analytics`
	: "/api/analytics";

interface AnalyticsSummary {
	success: boolean;
	data: {
		metrics: {
			[stage: string]: {
				entered: number;
				bounced: number;
				completed: number;
				bounceRate: number;
				completionRate: number;
			};
		};
		overall: {
			totalSessions: number;
			completedPayment: number;
			conversionRate: number;
		};
		dateRange: {
			start: string;
			end: string;
		};
	};
}

interface DailyTrends {
	success: boolean;
	data: {
		[date: string]: {
			search: { enter: number; exit: number; complete: number };
			confirm: { enter: number; exit: number; complete: number };
			payment: { enter: number; exit: number; complete: number };
		};
	};
}

export const analyticsApi = createApi({
	reducerPath: "analyticsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: ANALYTICS_BASE_URL,
		credentials: "include",
	}),
	endpoints: (builder) => ({
		getAnalyticsSummary: builder.query<
			AnalyticsSummary,
			{ startDate?: string; endDate?: string }
		>({
			query: ({ startDate, endDate }) => {
				const params = new URLSearchParams();
				if (startDate) params.append("startDate", startDate);
				if (endDate) params.append("endDate", endDate);
				return `/summary?${params.toString()}`;
			},
		}),
		getDailyTrends: builder.query<
			DailyTrends,
			{ startDate?: string; endDate?: string }
		>({
			query: ({ startDate, endDate }) => {
				const params = new URLSearchParams();
				if (startDate) params.append("startDate", startDate);
				if (endDate) params.append("endDate", endDate);
				return `/trends?${params.toString()}`;
			},
		}),
	}),
});

export const { useGetAnalyticsSummaryQuery, useGetDailyTrendsQuery } =
	analyticsApi;
