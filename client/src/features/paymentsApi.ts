import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	CreatePaymentIntentRequest,
	PaymentIntentResponse,
	ConfirmPaymentRequest,
	ConfirmPaymentResponse,
} from "../types/payment";

/**
 * paymentsApi - RTK Query API Slice for Payment Processing
 *
 * This file defines the API endpoints for payment processing using Stripe.
 * Handles payment intent creation and payment confirmation.
 *
 * - baseQuery: Defines the base URL for all requests (proxied to the backend).
 * - tagTypes: Used for cache invalidation and refetching.
 * - endpoints: Defines mutations for payment operations.
 */

export const paymentsApi = createApi({
	reducerPath: "paymentsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: "/api/payments",
		credentials: "include",
	}),
	tagTypes: ["Payment", "Reservation"],
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
			invalidatesTags: ["Payment", "Reservation"],
		}),
	}),
});

export const { useCreatePaymentIntentMutation, useConfirmPaymentMutation } =
	paymentsApi;

