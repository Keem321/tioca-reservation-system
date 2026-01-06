import { configureStore } from "@reduxjs/toolkit";
import { hotelsApi } from "./features/hotelsApi";
import { roomsApi } from "./features/roomsApi";
import { reservationsApi } from "./features/reservationsApi";
import { setupListeners } from "@reduxjs/toolkit/query";

/**
 * Redux Store Configuration
 *
 * This file sets up the Redux store for the frontend app.
 *
 * - Integrates the RTK Query API slices as reducers.
 * - Adds the RTK Query middleware for caching, invalidation, and auto-refetching.
 * - Calls setupListeners to enable refetchOnFocus/refetchOnReconnect features.
 *
 * See: https://redux-toolkit.js.org/
 */

export const store = configureStore({
	// Add all API reducers under their own keys
	reducer: {
		[hotelsApi.reducerPath]: hotelsApi.reducer,
		[roomsApi.reducerPath]: roomsApi.reducer,
		[reservationsApi.reducerPath]: reservationsApi.reducer,
	},
	// Add all RTK Query middleware for API caching and side effects
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware()
			.concat(hotelsApi.middleware)
			.concat(roomsApi.middleware)
			.concat(reservationsApi.middleware),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors for RTK Query
// refetchOnFocus: automatically refetch data when the app window regains focus
// refetchOnReconnect: automatically refetch data when the network connection is re-established
setupListeners(store.dispatch);

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
