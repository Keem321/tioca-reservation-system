import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	BaseQueryFn,
	FetchArgs,
	FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout } from "../features/authSlice";
import type { RootState } from "../store";

/**
 * Base Query with Automatic Re-authentication
 *
 * Wraps the standard fetchBaseQuery to handle 401 responses globally.
 * When a 401 is received (session expired), automatically logs out the user.
 * Only logs out if user is currently authenticated to prevent infinite loops.
 */
export const createBaseQueryWithReauth = (
	baseUrl: string
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
	const baseQuery = fetchBaseQuery({
		baseUrl,
		credentials: "include",
	});

	return async (args, api, extraOptions) => {
		const result = await baseQuery(args, api, extraOptions);

		// If we get a 401 response and user is currently logged in, session has expired
		if (result.error && result.error.status === 401) {
			const state = api.getState() as RootState;
			const user = state.auth.user;

			// Only dispatch logout if user is actually logged in
			// This prevents infinite logout loops when unauthenticated users
			// try to access protected endpoints
			if (user !== null) {
				console.log(
					"[API] 🚨 Received 401 - User was authenticated, session expired, logging out"
				);
				api.dispatch(logout());
			} else {
				console.log(
					"[API] ℹ️ Received 401 - User not authenticated (expected for public endpoints)"
				);
			}
		}

		return result;
	};
};
