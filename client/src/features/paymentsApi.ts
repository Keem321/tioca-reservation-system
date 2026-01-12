import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	CreatePaymentIntentRequest,
	PaymentIntentResponse,
	ConfirmPaymentRequest,
	ConfirmPaymentResponse,
} from "../types/payment";

// Additional types for payment reporting
interface Payment {
	_id: string;
	reservationId: {
		_id: string;
		guestName: string;
		guestEmail: string;
		checkInDate: string;
		checkOutDate: string;
	};
	userId?: {
		_id: string;
		name: string;
		email: string;
	};
	amount: number;
	currency: string;
	status:
		| "pending"
		| "processing"
		| "succeeded"
		| "failed"
		| "refunded"
		| "partial";
	stripePaymentIntentId: string;
	stripeChargeId?: string;
	failureReason?: string;
	receiptUrl?: string;
	createdAt: string;
	updatedAt: string;
}

interface PaymentStats {
	byStatus: {
		[status: string]: {
			count: number;
			amount: number;
		};
	};
	totalRevenue: number;
	totalCount: number;
}

interface RevenueReport {
	_id: {
		year: number;
		month: number;
	};
	totalRevenue: number;
	count: number;
	avgAmount: number;
}

interface PaymentFilter {
	dateFrom?: string;
	dateTo?: string;
	status?: string;
	reservationId?: string;
	limit?: number;
	skip?: number;
}

/**
 * paymentsApi - RTK Query API Slice for Payment Processing
 *
 * This file defines the API endpoints for payment processing using Stripe.
 * Handles payment intent creation, payment confirmation, and payment reporting.
 *
 * - baseQuery: Defines the base URL for all requests (proxied to the backend).
 * - tagTypes: Used for cache invalidation and refetching.
 * - endpoints: Defines mutations and queries for payment operations.
 */

export const paymentsApi = createApi({
	reducerPath: "paymentsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API_URL || ""}/api/payments`,
		credentials: "include",
	}),
	tagTypes: ["Payment", "PaymentStats", "RevenueReport", "Reservation"],
	endpoints: (builder) => ({
		// Create a payment intent for a reservation
		createPaymentIntent: builder.mutation<
			PaymentIntentResponse,
			CreatePaymentIntentRequest
		>({
			query: (data) => ({
				url: "/create-intent",
				method: "POST",
				body: data,
			}),
		}),
		// Confirm payment after Stripe processing
		confirmPayment: builder.mutation<
			ConfirmPaymentResponse,
			ConfirmPaymentRequest
		>({
			query: (data) => ({
				url: "/confirm",
				method: "POST",
				body: data,
			}),
			invalidatesTags: ["Payment", "PaymentStats", "Reservation"],
		}),
		// Get all payments with optional filtering
		getPayments: builder.query<Payment[], PaymentFilter>({
			query: (filters) => {
				const params = new URLSearchParams();
				if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
				if (filters.dateTo) params.append("dateTo", filters.dateTo);
				if (filters.status) params.append("status", filters.status);
				if (filters.reservationId)
					params.append("reservationId", filters.reservationId);
				if (filters.limit) params.append("limit", filters.limit.toString());
				if (filters.skip) params.append("skip", filters.skip.toString());
				return `/?${params.toString()}`;
			},
			providesTags: ["Payment"],
		}),
		// Get payment statistics
		getPaymentStats: builder.query<PaymentStats, PaymentFilter>({
			query: (filters) => {
				const params = new URLSearchParams();
				if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
				if (filters.dateTo) params.append("dateTo", filters.dateTo);
				if (filters.status) params.append("status", filters.status);
				return `/stats?${params.toString()}`;
			},
			providesTags: ["PaymentStats"],
		}),
		// Get single payment
		getPayment: builder.query<Payment, string>({
			query: (paymentId) => `/${paymentId}`,
			providesTags: (_result, _error, paymentId) => [
				{ type: "Payment", id: paymentId },
			],
		}),
		// Get payment by reservation
		getPaymentByReservation: builder.query<Payment, string>({
			query: (reservationId) => `/reservation/${reservationId}`,
			providesTags: (_result, _error, reservationId) => [
				{ type: "Payment", id: reservationId },
			],
		}),
		// Get revenue report
		getRevenueReport: builder.query<RevenueReport[], void>({
			query: () => "/reports/revenue",
			providesTags: ["RevenueReport"],
		}),
		// Process refund
		processRefund: builder.mutation<
			{ success: boolean; refundId: string; amount: number },
			{ reservationId: string; amount?: number }
		>({
			query: (data) => ({
				url: "/refund",
				method: "POST",
				body: data,
			}),
			invalidatesTags: ["Payment", "PaymentStats", "Reservation"],
		}),
		// Update payment
		updatePayment: builder.mutation<
			{ success: boolean; payment: Payment },
			{
				paymentId: string;
				description?: string;
				metadata?: Record<string, any>;
				reason?: string;
			}
		>({
			query: ({ paymentId, ...body }) => ({
				url: `/${paymentId}`,
				method: "PATCH",
				body,
			}),
			invalidatesTags: (_result, _error, { paymentId }) => [
				{ type: "Payment", id: paymentId },
				"PaymentStats",
			],
		}),
		// Get payment history
		getPaymentHistory: builder.query<
			Array<{
				_id: string;
				paymentId: string;
				editedBy: { _id: string; name: string; email: string };
				editedByName: string;
				editedByEmail: string;
				fieldName: string;
				beforeValue: any;
				afterValue: any;
				reason?: string;
				createdAt: string;
			}>,
			string
		>({
			query: (paymentId) => `/${paymentId}/history`,
			providesTags: (_result, _error, paymentId) => [
				{ type: "Payment", id: paymentId },
			],
		}),
	}),
});

export const {
	useCreatePaymentIntentMutation,
	useConfirmPaymentMutation,
	useGetPaymentsQuery,
	useGetPaymentStatsQuery,
	useGetPaymentQuery,
	useGetPaymentByReservationQuery,
	useGetRevenueReportQuery,
	useProcessRefundMutation,
	useUpdatePaymentMutation,
	useGetPaymentHistoryQuery,
} = paymentsApi;
