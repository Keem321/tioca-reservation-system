import { createApi } from "@reduxjs/toolkit/query/react";
import type { Room, RoomFormData } from "../types/room";
import { createBaseQueryWithReauth } from "../utils/baseQueryWithReauth";

/**
 * roomsApi - RTK Query API Slice for Rooms
 *
 * This file defines the API endpoints for room data using RTK Query.
 * Automatically generates hooks for each endpoint and handles caching.
 *
 * - baseQuery: Defines the base URL for all requests (proxied to the backend).
 * - tagTypes: Used for cache invalidation and refetching.
 * - endpoints: Defines queries (GET) and mutations (POST, PUT, DELETE) for rooms.
 */

export const roomsApi = createApi({
	reducerPath: "roomsApi",
	baseQuery: createBaseQueryWithReauth(`${import.meta.env.VITE_API_URL || ""}/api/rooms`),
	tagTypes: ["Room"],
	endpoints: (builder) => ({
		// Get all rooms
		getRooms: builder.query<Room[], void>({
			query: () => "/",
			providesTags: ["Room"],
		}),
		// Get a single room by ID
		getRoomById: builder.query<Room, string>({
			query: (id) => `/${id}`,
			providesTags: (_result, _error, id) => [{ type: "Room", id }],
		}),
		// Create a new room
		createRoom: builder.mutation<Room, RoomFormData>({
			query: (room) => ({
				url: "/",
				method: "POST",
				body: room,
			}),
			invalidatesTags: ["Room"],
		}),
		// Update a room
		updateRoom: builder.mutation<
			Room,
			{ id: string; data: Partial<RoomFormData> }
		>({
			query: ({ id, data }) => ({
				url: `/${id}`,
				method: "PUT",
				body: data,
			}),
			invalidatesTags: ["Room"],
		}),
		// Delete a room
		deleteRoom: builder.mutation<void, string>({
			query: (id) => ({
				url: `/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: ["Room"],
		}),
		// Update room status
		updateRoomStatus: builder.mutation<Room, { id: string; status: string }>({
			query: ({ id, status }) => ({
				url: `/${id}/status`,
				method: "PATCH",
				body: { status },
			}),
			invalidatesTags: ["Room"],
		}),
		// Search available rooms with filters
		searchAvailableRooms: builder.query<
			Room[],
			{
				checkIn: string;
				checkOut: string;
				floor?: string;
				quality?: string;
			}
		>({
			query: ({ checkIn, checkOut, floor, quality }) => {
				const params = new URLSearchParams({
					checkIn,
					checkOut,
				});
				if (floor) params.append("floor", floor);
				if (quality) params.append("quality", quality);
				return `/available?${params.toString()}`;
			},
			providesTags: ["Room"],
		}),
		// Get recommended rooms with partial availability
		getRecommendedRooms: builder.query<
			Room[],
			{
				checkIn: string;
				checkOut: string;
				floor?: string;
				quality?: string;
			}
		>({
			query: ({ checkIn, checkOut, floor, quality }) => {
				const params = new URLSearchParams({
					checkIn,
					checkOut,
				});
				if (floor) params.append("floor", floor);
				if (quality) params.append("quality", quality);
				return `/recommended?${params.toString()}`;
			},
			providesTags: ["Room"],
		}),
	}),
});

export const {
	useGetRoomsQuery,
	useGetRoomByIdQuery,
	useCreateRoomMutation,
	useUpdateRoomMutation,
	useDeleteRoomMutation,
	useUpdateRoomStatusMutation,
	useSearchAvailableRoomsQuery,
	useGetRecommendedRoomsQuery,
} = roomsApi;
