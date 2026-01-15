import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from "@reduxjs/toolkit";

export interface User {
	id: string;
	email: string;
	name?: string;
	provider?: string;
	role?: string;
	currencyPreference?: string;
}

export interface AuthState {
	user: User | null;
	isLoading: boolean;
	hasChecked: boolean;
	error: string | null;
}

const initialState: AuthState = {
	user: null,
	isLoading: true,
	hasChecked: false,
	error: null,
};

/**
 * Async thunk to check if user is logged in
 * Queries the server to get current auth status
 */
export const checkAuth = createAsyncThunk("auth/checkAuth", async () => {
	const apiUrl = import.meta.env.VITE_API_URL || "";
	const res = await fetch(`${apiUrl}/api/auth/loggedin`, {
		credentials: "include",
	});
	if (!res.ok) throw new Error("Not authenticated");
	const data = await res.json();
	return data.user;
});

/**
 * Async thunk to logout user
 * Calls the server logout endpoint and clears session
 */
export const logout = createAsyncThunk("auth/logout", async () => {
	const apiUrl = import.meta.env.VITE_API_URL || "";
	try {
		const response = await fetch(`${apiUrl}/api/auth/logout`, {
			method: "POST",
			credentials: "include",
		});

		// Don't throw on non-ok responses - logout should succeed regardless
		// The session is being destroyed on backend
		console.log("[Auth] Logout response status:", response.status);
		return { success: true };
	} catch (error) {
		console.error("[Auth] Logout error:", error);
		// Still consider logout successful - user's intent is clear
		return { success: true };
	}
});

/**
 * Async thunk to keep session alive
 * Pings the server to refresh the session activity timestamp
 */
export const keepAlive = createAsyncThunk("auth/keepAlive", async () => {
	const apiUrl = import.meta.env.VITE_API_URL || "";
	const res = await fetch(`${apiUrl}/api/auth/keepalive`, {
		method: "POST",
		credentials: "include",
	});
	if (!res.ok) throw new Error("Failed to refresh session");
	const data = await res.json();
	return data;
});

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		/**
		 * Set user directly when login completes
		 * Used after successful local or OAuth login
		 */
		setUser(state, action: PayloadAction<User>) {
			state.user = action.payload;
			state.hasChecked = true;
			state.isLoading = false;
			state.error = null;
		},
		/**
		 * Clear error messages
		 */
		clearError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Check auth
			.addCase(checkAuth.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(checkAuth.fulfilled, (state, action) => {
				state.isLoading = false;
				state.user = action.payload || null;
				state.hasChecked = true;
			})
			.addCase(checkAuth.rejected, (state) => {
				state.isLoading = false;
				state.hasChecked = true;
				state.user = null;
			})

			// Logout
			.addCase(logout.fulfilled, (state) => {
				state.user = null;
				state.error = null;
				state.hasChecked = true;
			})
			.addCase(logout.rejected, (state) => {
				// Clear user even if logout request fails - user explicitly clicked logout
				state.user = null;
				state.error = null;
				state.hasChecked = true;
			});
	},
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
