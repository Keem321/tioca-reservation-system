import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQueryWithReauth";

/**
 * holdsApi - RTK Query API Slice for Room Holds
 *
 * This file defines the API endpoints for managing temporary room holds
 * to prevent overbooking during the booking process.
 */

export interface RoomHold {
	_id: string;
	roomId: {
		_id: string;
		podId: string;
		quality: string;
		floor: string;
		pricePerNight: number;
	};
	checkInDate: string;
	checkOutDate: string;
	sessionId: string;
	userId?: string;
	holdExpiry: string;
	stage: "confirmation" | "payment";
	converted: boolean;
	reservationId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateHoldRequest {
	roomId: string;
	checkInDate: string;
	checkOutDate: string;
	stage?: "confirmation" | "payment";
}

export interface ExtendHoldRequest {
	stage?: "confirmation" | "payment";
}

export const holdsApi = createApi({
	reducerPath: "holdsApi",
	baseQuery: createBaseQueryWithReauth("/api/holds"),
	tagTypes: ["Hold"],
	endpoints: (builder) => ({
		// Create a new hold
		createHold: builder.mutation<RoomHold, CreateHoldRequest>({
			query: (holdData) => ({
				url: "",
				method: "POST",
				body: holdData,
			}),
			invalidatesTags: ["Hold"],
		}),

		// Get active holds for current session
		getSessionHolds: builder.query<RoomHold[], void>({
			query: () => "session",
			providesTags: ["Hold"],
		}),

		// Validate a hold
		validateHold: builder.query<{ valid: boolean }, string>({
			query: (holdId) => `/${holdId}/validate`,
		}),

		// Extend an existing hold
		extendHold: builder.mutation<
			RoomHold,
			{ id: string; data: ExtendHoldRequest }
		>({
			query: ({ id, data }) => ({
				url: `/${id}/extend`,
				method: "PATCH",
				body: data,
			}),
			invalidatesTags: ["Hold"],
		}),

		// Release a hold
		releaseHold: builder.mutation<void, string>({
			query: (holdId) => ({
				url: `/${holdId}`,
				method: "DELETE",
			}),
			invalidatesTags: ["Hold"],
		}),
	}),
});

export const {
	useCreateHoldMutation,
	useGetSessionHoldsQuery,
	useValidateHoldQuery,
	useExtendHoldMutation,
	useReleaseHoldMutation,
} = holdsApi;
