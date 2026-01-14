/**
 * Money Utility Functions
 * Handles conversion between USD/JPY and formatting for display
 * All internal prices are stored in cents (as integers)
 */

// Exchange rates (you may want to fetch these from an API in production)
const EXCHANGE_RATES = {
	USD: 1,
	JPY: 130, // 1 USD = ~130 JPY (approximate, update as needed)
};

/**
 * Convert USD dollar amount to cents
 * @param {number} usdAmount - Amount in USD dollars
 * @returns {number} Amount in cents
 */
export function convertToCents(usdAmount) {
	return Math.round(usdAmount * 100);
}

/**
 * Convert cents back to USD dollars
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in USD dollars
 */
export function convertFromCents(cents) {
	return cents / 100;
}

/**
 * Format money for display with proper currency symbol and decimals
 * @param {number} cents - Amount in cents (USD)
 * @param {string} currency - 'USD' or 'JPY'
 * @returns {string} Formatted string like "$65.00" or "¥8,450"
 */
export function formatMoney(cents, currency = "USD") {
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
 * Convert USD cents to another currency's cents
 * @param {number} centsToCurrency - Amount in the target currency (still as cents for precision)
 * @param {string} targetCurrency - Target currency code
 * @returns {number} Converted amount in the target currency's cents equivalent
 */
export function convertCents(cents, targetCurrency = "USD") {
	if (targetCurrency === "USD") {
		return cents;
	}

	const usdAmount = convertFromCents(cents);
	const convertedAmount = usdAmount * EXCHANGE_RATES[targetCurrency];
	return convertToCents(convertedAmount);
}

/**
 * Get the default currency based on user preference
 * @param {string} userPreference - User's saved currency preference ('USD' or 'JPY')
 * @returns {string} Currency code
 */
export function getDefaultCurrency(userPreference = "USD") {
	const validCurrencies = Object.keys(EXCHANGE_RATES);
	return validCurrencies.includes(userPreference) ? userPreference : "USD";
}

/**
 * Get all available currencies
 * @returns {string[]} Array of currency codes
 */
export function getAvailableCurrencies() {
	return Object.keys(EXCHANGE_RATES);
}

/**
 * Update exchange rates (for production, you might fetch from an API)
 * @param {object} rates - Object with currency codes as keys and rates as values
 */
export function updateExchangeRates(rates) {
	Object.assign(EXCHANGE_RATES, rates);
}
