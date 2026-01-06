import { configureStore } from "@reduxjs/toolkit";
import { hotelsApi } from "./features/hotelsApi";
import { roomsApi } from "./features/roomsApi";
import bookingReducer from "./features/bookingSlice";
import { setupListeners } from "@reduxjs/toolkit/query";

/**
 * Redux Store Configuration
 *
 * This file sets up the Redux store for the frontend app.
 *
 * - Integrates the RTK Query API slices (hotelsApi, roomsApi) as reducers.
 * - Adds the booking slice for managing booking form state.
 * - Adds the RTK Query middleware for caching, invalidation, and auto-refetching.
 * - Calls setupListeners to enable refetchOnFocus/refetchOnReconnect features.
 *
 * See: https://redux-toolkit.js.org/
 */

export const store = configureStore({
	// Add the API reducers and booking slice
	reducer: {
		[hotelsApi.reducerPath]: hotelsApi.reducer,
		[roomsApi.reducerPath]: roomsApi.reducer,
		booking: bookingReducer,
	},
	// Add the RTK Query middleware for API caching and side effects
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(
			hotelsApi.middleware,
			roomsApi.middleware
		),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors for RTK Query
// refetchOnFocus: automatically refetch data when the app window regains focus
// refetchOnReconnect: automatically refetch data when the network connection is re-established
setupListeners(store.dispatch);

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
