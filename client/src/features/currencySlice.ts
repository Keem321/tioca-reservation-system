import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CurrencyState {
	preference: string; // "USD" or "JPY"
}

const initialState: CurrencyState = {
	preference: "USD",
};

/**
 * Currency Slice
 * Manages the user's currency preference for display throughout the app
 * This is synced from user profile and used to format all prices
 */
const currencySlice = createSlice({
	name: "currency",
	initialState,
	reducers: {
		/**
		 * Set the currency preference
		 */
		setCurrency(state, action: PayloadAction<string>) {
			const validCurrencies = ["USD", "JPY"];
			state.preference = validCurrencies.includes(action.payload)
				? action.payload
				: "USD";
		},
	},
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;
