import { useSelector } from "react-redux";
import type { RootState } from "../store";
import {
	formatMoney,
	formatPricePerNight,
	formatTotalPrice,
} from "../utils/money";

/**
 * Custom hook to format money using the user's currency preference from Redux store
 * This ensures consistent currency display throughout the app
 */
export function useFormatMoney() {
	const currencyPreference = useSelector(
		(state: RootState) => state.currency.preference
	);

	return {
		/**
		 * Format cents to currency string (e.g., "$65.00" or "¥8,450")
		 */
		formatMoney: (cents: number) => formatMoney(cents, currencyPreference),

		/**
		 * Format price per night (e.g., "$65.00/night")
		 */
		formatPricePerNight: (centsPerNight: number) =>
			formatPricePerNight(centsPerNight, currencyPreference),

		/**
		 * Format total price with optional breakdown
		 */
		formatTotalPrice: (
			totalCents: number,
			perNight?: number,
			nights?: number
		) => formatTotalPrice(totalCents, currencyPreference, perNight, nights),

		/**
		 * Get current currency code
		 */
		currency: currencyPreference,
	};
}
