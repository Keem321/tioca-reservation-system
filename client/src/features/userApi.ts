import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { User } from "../features/authSlice";
import type { Reservation } from "../types/reservation";

export interface ProfileUpdateData {
	name?: string;
	email?: string;
}

export interface PasswordChangeData {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

/**
 * userApi - RTK Query API Slice for User/Profile endpoints
 *
 * This file defines the API endpoints for user profile management.
 * Automatically generates hooks for each endpoint and handles caching.
 */
export const userApi = createApi({
	reducerPath: "userApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `${import.meta.env.VITE_API_URL || ""}/api/user`,
		credentials: "include",
	}),
	tagTypes: ["Profile", "ActiveReservations"],
	endpoints: (builder) => ({
		// Get current user's profile
		getProfile: builder.query<User, void>({
			query: () => "/profile",
			providesTags: ["Profile"],
		}),

		// Update user profile (name, email)
		updateProfile: builder.mutation<User, ProfileUpdateData>({
			query: (data) => ({
				url: "/profile",
				method: "PUT",
				body: data,
			}),
			invalidatesTags: ["Profile"],
		}),

		// Change user password
		changePassword: builder.mutation<{ message: string }, PasswordChangeData>({
			query: (data) => ({
				url: "/change-password",
				method: "POST",
				body: data,
			}),
		}),

		// Get user's active/upcoming reservations
		getActiveReservations: builder.query<Reservation[], void>({
			query: () => "/active-reservations",
			providesTags: ["ActiveReservations"],
		}),
	}),
});

export const {
	useGetProfileQuery,
	useUpdateProfileMutation,
	useChangePasswordMutation,
	useGetActiveReservationsQuery,
} = userApi;
