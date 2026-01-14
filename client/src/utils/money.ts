/**
 * Money Utility Functions (Frontend)
 * Handles conversion between USD/JPY and formatting for display
 * All internal prices are stored in cents (as integers)
 */

// Exchange rates (synced with backend)
const EXCHANGE_RATES: Record<string, number> = {
	USD: 1,
	JPY: 130, // 1 USD = ~130 JPY (approximate, update as needed)
};

/**
 * Convert USD dollar amount to cents
 * @param usdAmount - Amount in USD dollars
 * @returns Amount in cents
 */
export function convertToCents(usdAmount: number): number {
	return Math.round(usdAmount * 100);
}

/**
 * Convert cents back to USD dollars
 * @param cents - Amount in cents
 * @returns Amount in USD dollars
 */
export function convertFromCents(cents: number): number {
	return cents / 100;
}

/**
 * Format money for display with proper currency symbol and decimals
 * @param cents - Amount in cents (USD)
 * @param currency - 'USD' or 'JPY'
 * @returns Formatted string like "$65.00" or "¥8,450"
 */
export function formatMoney(cents: number, currency: string = "USD"): string {
	const usdAmount = convertFromCents(cents);

	if (currency === "USD") {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(usdAmount);
	} else if (currency === "JPY") {
		const jpyAmount = usdAmount * EXCHANGE_RATES.JPY;
		return new Intl.NumberFormat("ja-JP", {
			style: "currency",
			currency: "JPY",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(jpyAmount);
	}

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency,
	}).format(usdAmount);
}

/**
 * Format price per night for display
 * @param centsPerNight - Nightly price in cents
 * @param currency - Target currency
 * @returns Formatted string like "$65.00/night"
 */
export function formatPricePerNight(
	centsPerNight: number,
	currency: string = "USD"
): string {
	return `${formatMoney(centsPerNight, currency)}/night`;
}

/**
 * Format total price with optional breakdown
 * @param totalCents - Total in cents
 * @param currency - Target currency
 * @param perNight - Optional per-night rate for calculation
 * @param nights - Optional number of nights
 * @returns Formatted price string
 */
export function formatTotalPrice(
	totalCents: number,
	currency: string = "USD",
	perNight?: number,
	nights?: number
): string {
	const formatted = formatMoney(totalCents, currency);

	if (perNight && nights) {
		const perNightFormatted = formatMoney(perNight, currency);
		return `${formatted} (${perNightFormatted} × ${nights} nights)`;
	}

	return formatted;
}

/**
 * Convert cents to another currency
 * @param cents - Amount in cents (USD)
 * @param targetCurrency - Target currency code
 * @returns Converted amount in target currency's cents equivalent
 */
export function convertCents(
	cents: number,
	targetCurrency: string = "USD"
): number {
	if (targetCurrency === "USD") {
		return cents;
	}

	const usdAmount = convertFromCents(cents);
	const convertedAmount = usdAmount * EXCHANGE_RATES[targetCurrency];
	return convertToCents(convertedAmount);
}

/**
 * Get the default currency based on user preference
 * @param userPreference - User's saved currency preference ('USD' or 'JPY')
 * @returns Currency code
 */
export function getDefaultCurrency(userPreference: string = "USD"): string {
	const validCurrencies = Object.keys(EXCHANGE_RATES);
	return validCurrencies.includes(userPreference) ? userPreference : "USD";
}

/**
 * Get all available currencies
 * @returns Array of currency codes
 */
export function getAvailableCurrencies(): string[] {
	return Object.keys(EXCHANGE_RATES);
}

/**
 * Update exchange rates
 * @param rates - Object with currency codes as keys and rates as values
 */
export function updateExchangeRates(rates: Record<string, number>): void {
	Object.assign(EXCHANGE_RATES, rates);
}
