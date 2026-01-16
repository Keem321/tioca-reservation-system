import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../utils/baseQueryWithReauth";
import type { Reservation, ReservationFormData } from "../types/reservation";

/**
 * reservationsApi - RTK Query API Slice for Reservations
 *
 * This file defines the API endpoints for reservation data using RTK Query.
 * Automatically generates hooks for each endpoint and handles caching.
 */

export const reservationsApi = createApi({
	reducerPath: "reservationsApi",
	baseQuery: createBaseQueryWithReauth(
		`${import.meta.env.VITE_API_URL || ""}/reservations`
	),
	tagTypes: ["Reservation"],
	endpoints: (builder) => ({
		// Get all reservations with optional filters
		getReservations: builder.query<
			Reservation[],
			{
				status?: string;
				dateFrom?: string;
				dateTo?: string;
				guestEmail?: string;
				podId?: string;
			} | void
		>({
			query: (filters) => {
				const params = new URLSearchParams();
				if (filters) {
					if (filters.status) params.append("status", filters.status);
					if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
					if (filters.dateTo) params.append("dateTo", filters.dateTo);
					if (filters.guestEmail)
						params.append("guestEmail", filters.guestEmail);
					if (filters.podId) params.append("podId", filters.podId);
				}
				const queryString = params.toString();
				return queryString ? `/?${queryString}` : "/";
			},
			providesTags: ["Reservation"],
		}),
		// Get available time slots for a room on a date
		getAvailableSlots: builder.query<
			{ slots: string[] },
			{ roomId: string; date: string }
		>({
			query: ({ roomId, date }) => `/${roomId}/slots?date=${date}`,
		}),
		// Get reservations by user ID
		getReservationsByUser: builder.query<Reservation[], string>({
			query: (userId) => `/user/${userId}`,
			providesTags: ["Reservation"],
		}),
		// Get a single reservation by ID
		getReservationById: builder.query<Reservation, string>({
			query: (id) => `/${id}`,
			providesTags: (_result, _error, id) => [{ type: "Reservation", id }],
		}),
		// Create a new reservation
		createReservation: builder.mutation<Reservation, ReservationFormData>({
			query: (reservation) => ({
				url: "/",
				method: "POST",
				body: reservation,
			}),
			invalidatesTags: ["Reservation"],
		}),
		// Update a reservation (manager only)
		updateReservation: builder.mutation<
			Reservation,
			{ id: string; data: Partial<ReservationFormData> }
		>({
			query: ({ id, data }) => ({
				url: `/${id}`,
				method: "PUT",
				body: data,
			}),
			invalidatesTags: ["Reservation"],
		}),
		// Modify a reservation (guest can modify their own)
		modifyReservation: builder.mutation<
			Reservation,
			{ id: string; data: Partial<ReservationFormData> }
		>({
			query: ({ id, data }) => ({
				url: `/${id}/modify`,
				method: "PATCH",
				body: data,
			}),
			invalidatesTags: ["Reservation"],
		}),
		// Delete a reservation
		deleteReservation: builder.mutation<void, string>({
			query: (id) => ({
				url: `/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: ["Reservation"],
		}),
		// Cancel a reservation
		cancelReservation: builder.mutation<
			Reservation,
			{ id: string; reason?: string }
		>({
			query: ({ id, reason }) => ({
				url: `/${id}/cancel`,
				method: "POST",
				body: { reason },
			}),
			invalidatesTags: ["Reservation"],
		}),
		// Check in a reservation
		checkIn: builder.mutation<Reservation, string>({
			query: (id) => ({
				url: `/${id}/check-in`,
				method: "POST",
			}),
			invalidatesTags: ["Reservation"],
		}),
		// Check out a reservation
		checkOut: builder.mutation<Reservation, string>({
			query: (id) => ({
				url: `/${id}/check-out`,
				method: "POST",
			}),
			invalidatesTags: ["Reservation"],
		}),
		// Update reservation status
		updateReservationStatus: builder.mutation<
			Reservation,
			{ id: string; status: string }
		>({
			query: ({ id, status }) => ({
				url: `/${id}/status`,
				method: "PATCH",
				body: { status },
			}),
			invalidatesTags: ["Reservation"],
		}),
		// Get upcoming check-ins
		getUpcomingCheckIns: builder.query<Reservation[], { days?: number }>({
			query: ({ days = 7 }) => `/upcoming-checkins?days=${days}`,
			providesTags: ["Reservation"],
		}),
		// Get current check-outs
		getCurrentCheckOuts: builder.query<Reservation[], string | void>({
			query: () => `/current-checkouts`,
			providesTags: ["Reservation"],
		}),
	}),
});

export const {
	useGetReservationsQuery,
	useGetReservationsByUserQuery,
	useGetReservationByIdQuery,
	useCreateReservationMutation,
	useUpdateReservationMutation,
	useModifyReservationMutation,
	useDeleteReservationMutation,
	useCancelReservationMutation,
	useCheckInMutation,
	useCheckOutMutation,
	useUpdateReservationStatusMutation,
	useGetUpcomingCheckInsQuery,
	useGetCurrentCheckOutsQuery,
	useGetAvailableSlotsQuery,
} = reservationsApi;
