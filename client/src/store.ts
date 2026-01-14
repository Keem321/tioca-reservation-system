import { configureStore } from "@reduxjs/toolkit";
import { roomsApi } from "./features/roomsApi";
import { reservationsApi } from "./features/reservationsApi";
import { userApi } from "./features/userApi";
import { paymentsApi } from "./features/paymentsApi";
import { holdsApi } from "./features/holdsApi";
import { offeringsApi } from "./features/offeringsApi";
import bookingReducer from "./features/bookingSlice";
import authReducer from "./features/authSlice";
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
	reducer: {
		auth: authReducer,
		booking: bookingReducer,
		[roomsApi.reducerPath]: roomsApi.reducer,
		[reservationsApi.reducerPath]: reservationsApi.reducer,
		[userApi.reducerPath]: userApi.reducer,
		[paymentsApi.reducerPath]: paymentsApi.reducer,
		[holdsApi.reducerPath]: holdsApi.reducer,
		[offeringsApi.reducerPath]: offeringsApi.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat([
			roomsApi.middleware,
			reservationsApi.middleware,
			userApi.middleware,
			paymentsApi.middleware,
			holdsApi.middleware,
			offeringsApi.middleware,
		]),
});

// Enable refetchOnFocus/refetchOnReconnect behaviors for RTK Query
// refetchOnFocus: automatically refetch data when the app window regains focus
// refetchOnReconnect: automatically refetch data when the network connection is re-established
setupListeners(store.dispatch);

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
