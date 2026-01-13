import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
	BaseQueryFn,
	FetchArgs,
	FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout } from "../features/authSlice";

/**
 * Base Query with Automatic Re-authentication
 *
 * Wraps the standard fetchBaseQuery to handle 401 responses globally.
 * When a 401 is received (session expired), automatically logs out the user.
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

		// If we get a 401 response, the session has expired
		if (result.error && result.error.status === 401) {
			console.log("[API] 🚨 Received 401 - Session expired, logging out");

			// Dispatch logout action to clear user state
			api.dispatch(logout());

			// The ProtectedRoute component will handle redirect to /login
		}

		return result;
	};
};
