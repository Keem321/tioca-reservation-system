import { configureStore } from "@reduxjs/toolkit";
import { hotelsApi } from "./features/hotelsApi";
import { setupListeners } from "@reduxjs/toolkit/query";

/**
 * Redux Store Configuration
 *
 * This file sets up the Redux store for the frontend app.
 *
 * - Integrates the RTK Query API slice (hotelsApi) as a reducer.
 * - Adds the RTK Query middleware for caching, invalidation, and auto-refetching.
 * - Calls setupListeners to enable refetchOnFocus/refetchOnReconnect features.
 *
 * See: https://redux-toolkit.js.org/
 */

export const store = configureStore({
	// Add the hotelsApi reducer under its own key
	reducer: {
		[hotelsApi.reducerPath]: hotelsApi.reducer,
	},
	// Add the RTK Query middleware for API caching and side effects
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(hotelsApi.middleware),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors for RTK Query
// refetchOnFocus: automatically refetch data when the app window regains focus
// refetchOnReconnect: automatically refetch data when the network connection is re-established
setupListeners(store.dispatch);

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
