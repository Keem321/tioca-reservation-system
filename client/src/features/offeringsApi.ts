/**
 * Offerings API
 * RTK Query hooks for managing room and amenity offerings
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	Offering,
	RoomOffering,
	AmenityOffering,
} from "../types/offering";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const offeringsApi = createApi({
	reducerPath: "offeringsApi",
	baseQuery: fetchBaseQuery({
		baseUrl: BASE_URL,
		credentials: "include",
	}),
	tagTypes: ["Offering"],
	endpoints: (builder) => ({
		/**
		 * Get all offerings
		 */
		getOfferings: builder.query<
			Offering[],
			{ type?: string; activeOnly?: boolean }
		>({
			query: ({ type, activeOnly = true }) => {
				const params = new URLSearchParams();
				if (type) params.append("type", type);
				params.append("activeOnly", String(activeOnly));
				return `/offerings?${params.toString()}`;
			},
			providesTags: ["Offering"],
		}),

		/**
		 * Get room offerings only
		 */
		getRoomOfferings: builder.query<RoomOffering[], { activeOnly?: boolean }>({
			query: ({ activeOnly = true }) => {
				return `/offerings/room-offerings?activeOnly=${activeOnly}`;
			},
			providesTags: ["Offering"],
		}),

		/**
		 * Get amenity offerings only
		 */
		getAmenityOfferings: builder.query<
			AmenityOffering[],
			{ activeOnly?: boolean }
		>({
			query: ({ activeOnly = true }) => {
				return `/offerings/amenity-offerings?activeOnly=${activeOnly}`;
			},
			providesTags: ["Offering"],
		}),

		/**
		 * Get single offering by ID
		 */
		getOfferingById: builder.query<Offering, string>({
			query: (id) => `/offerings/${id}`,
			providesTags: (_result, _error, id) => [{ type: "Offering", id }],
		}),

		/**
		 * Create new offering
		 */
		createOffering: builder.mutation<Offering, Partial<Offering>>({
			query: (data) => ({
				url: "/offerings",
				method: "POST",
				body: data,
			}),
			invalidatesTags: ["Offering"],
		}),

		/**
		 * Update existing offering
		 */
		updateOffering: builder.mutation<
			Offering,
			{ id: string; data: Partial<Offering> }
		>({
			query: ({ id, data }) => ({
				url: `/offerings/${id}`,
				method: "PUT",
				body: data,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: "Offering", id },
				"Offering",
			],
		}),

		/**
		 * Delete offering
		 */
		deleteOffering: builder.mutation<void, string>({
			query: (id) => ({
				url: `/offerings/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: ["Offering"],
		}),

		// Note: Price calculation is handled server-side via reservation service
	}),
});

export const {
	useGetOfferingsQuery,
	useGetRoomOfferingsQuery,
	useGetAmenityOfferingsQuery,
	useGetOfferingByIdQuery,
	useCreateOfferingMutation,
	useUpdateOfferingMutation,
	useDeleteOfferingMutation,
} = offeringsApi;
