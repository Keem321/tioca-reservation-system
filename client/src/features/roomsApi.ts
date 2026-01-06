import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * roomsApi - RTK Query API Slice for Room Availability and Search
 *
 * This file defines the API endpoints for room data using RTK Query.
 * Handles room availability checks, search queries, and room details.
 *
 * - baseQuery: Defines the base URL for all requests (proxied to the backend).
 * - tagTypes: Used for cache invalidation and refetching.
 * - endpoints: Defines queries for room availability and search.
 *
 * Usage:
 *   - useSearchRoomsQuery: Search for available rooms based on dates and guests.
 *   - useGetRoomTypesQuery: Fetch all available room types.
 *
 * See: https://redux-toolkit.js.org/rtk-query/overview
 */

export interface RoomSearchParams {
	checkIn: string;
	checkOut: string;
	guests: number;
}

export interface RoomType {
	id: string;
	name: string;
	price: number;
	features: string;
	available: boolean;
	capacity: number;
}

export interface RoomSearchResponse {
	rooms: RoomType[];
	available: boolean;
}

export const roomsApi = createApi({
	// Unique key for this API slice in the Redux store
	reducerPath: "roomsApi",
	// Base query configuration for all endpoints
	baseQuery: fetchBaseQuery({
		baseUrl: "/api/rooms",
		credentials: "include",
	}),
	// Tag types for cache management
	tagTypes: ["Room"],
	// Define endpoints (queries and mutations)
	endpoints: (builder) => ({
		/**
		 * searchRooms - Search for available rooms based on check-in, check-out, and guest count
		 *
		 * Usage: const { data, error, isLoading } = useSearchRoomsQuery({ checkIn: '2024-01-01', checkOut: '2024-01-05', guests: 2 });
		 */
		searchRooms: builder.query<RoomSearchResponse, RoomSearchParams>({
			query: (params) => ({
				url: "/search",
				params: {
					checkIn: params.checkIn,
					checkOut: params.checkOut,
					guests: params.guests,
				},
			}),
			providesTags: ["Room"],
		}),
		/**
		 * getRoomTypes - Fetch all available room types
		 *
		 * Usage: const { data, error, isLoading } = useGetRoomTypesQuery();
		 */
		getRoomTypes: builder.query<RoomType[], void>({
			query: () => "/types",
			providesTags: ["Room"],
		}),
	}),
});

// Export auto-generated hooks for use in components
export const { useSearchRoomsQuery, useGetRoomTypesQuery } = roomsApi;

