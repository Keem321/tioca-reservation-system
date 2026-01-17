import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import {
	formatMoney as formatMoneUtil,
	formatPricePerNight as formatPricePerNightUtil,
	formatTotalPrice as formatTotalPriceUtil,
} from "./utils/money";

// Typed Redux hooks for safer state selection and dispatch
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook to get currency-aware money formatting functions
 * Reads currency preference from Redux store and provides formatting functions
 * that automatically use the selected currency (USD or JPY)
 */
export function useFormatMoney() {
	const currencyPreference = useAppSelector(
		(state) => state.currency.preference
	);

	return {
		formatMoney: (cents: number) => formatMoneUtil(cents, currencyPreference),
		formatPricePerNight: (centsPerNight: number) =>
			formatPricePerNightUtil(centsPerNight, currencyPreference),
		formatTotalPrice: (
			totalCents: number,
			perNight?: number,
			nights?: number
		) => formatTotalPriceUtil(totalCents, currencyPreference, perNight, nights),
	};
}
