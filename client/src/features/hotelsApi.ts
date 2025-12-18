import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const hotelsApi = createApi({
	reducerPath: "hotelsApi",
	baseQuery: fetchBaseQuery({ baseUrl: "/api/hotels" }),
	tagTypes: ["Hotel"],
	endpoints: (builder) => ({
		getHotels: builder.query({
			query: () => "/",
			providesTags: ["Hotel"],
		}),
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

export const { useGetHotelsQuery, useCreateHotelMutation } = hotelsApi;
