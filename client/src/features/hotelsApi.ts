import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * hotelsApi - RTK Query API Slice for Hotels
 *
 * This file defines the API endpoints for hotel data using RTK Query.
 * RTK Query automatically generates hooks for each endpoint, handles caching, and integrates with Redux.
 *
 * - baseQuery: Defines the base URL for all requests (proxied to the backend).
 * - tagTypes: Used for cache invalidation and refetching.
 * - endpoints: Defines queries (GET) and mutations (POST, PUT, DELETE) for hotels.
 *
 * Usage:
 *   - useGetHotelsQuery: Fetches all hotels.
 *   - useCreateHotelMutation: Creates a new hotel.
 *
 * See: https://redux-toolkit.js.org/rtk-query/overview
 */

export const hotelsApi = createApi({
	// Unique key for this API slice in the Redux store
	reducerPath: "hotelsApi",
	// Base query configuration for all endpoints
	baseQuery: fetchBaseQuery({ baseUrl: "/api/hotels" }),
	// Tag types for cache management
	tagTypes: ["Hotel"],
	// Define endpoints (queries and mutations)
	endpoints: (builder) => ({
		/**
		 * getHotels - Fetch all hotels from the backend
		 *
		 * Usage: const { data, error, isLoading } = useGetHotelsQuery();
		 */
		getHotels: builder.query({
			query: () => "/",
			providesTags: ["Hotel"],
		}),
		/**
		 * createHotel - Create a new hotel
		 *
		 * Usage: const [createHotel, { data, error, isLoading }] = useCreateHotelMutation();
		 */
		createHotel: builder.mutation({
			query: (hotel) => ({
				url: "/",
				method: "POST",
				body: hotel,
			}),
			invalidatesTags: ["Hotel"],
		}),
		// Add update and delete as needed
	}),
});

// Export auto-generated hooks for use in components
export const { useGetHotelsQuery, useCreateHotelMutation } = hotelsApi;
