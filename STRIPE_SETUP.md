# Stripe Payment Setup Guide

This guide will help you set up Stripe payments for the TIOCA Reservation System.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard (https://dashboard.stripe.com)

## Step 1: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for test mode or `pk_live_` for live mode)
   - **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)

## Step 2: Configure Frontend (Client)

1. Create a `.env` or `.env.development` file in the `client/` directory
2. Add your Stripe publishable key:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**Important:** 
- For Vite, environment variables must start with `VITE_` to be exposed to the client
- Use test keys (`pk_test_...`) for development
- Use live keys (`pk_live_...`) for production

3. Restart your Vite dev server after adding the environment variable

## Step 3: Configure Backend (Server)

1. Add your Stripe secret key to `server/.env.development` or `server/.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
# OR
STRIPE_SECRET=sk_test_your_secret_key_here
```

**Important:**
- Never commit secret keys to version control
- The backend accepts either `STRIPE_SECRET_KEY` or `STRIPE_SECRET` (for backwards compatibility)
- Use test keys for development, live keys for production

## Step 4: Test Your Setup

1. Start both the client and server:
   ```bash
   npm run dev
   ```

2. Navigate to the booking page and complete a booking
3. You should see the payment form on the payment page
4. **Use a test card number** (see "Test Cards" section below) - **DO NOT use your real credit card!**
5. Enter the test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
6. Submit the payment - it should process successfully without charging any real money

## Troubleshooting

### Error: "ERR_BLOCKED_BY_CLIENT" or "Failed to fetch https://r.stripe.com/b"

This error occurs when an ad blocker or browser extension blocks Stripe.js requests.

**Solutions:**
1. **Disable ad blockers** for localhost or your development domain
2. **Whitelist Stripe domains** in your ad blocker:
   - `*.stripe.com`
   - `*.stripejs.com`
3. **Use a different browser** or incognito mode
4. **Check browser extensions** that might block third-party scripts

### Error: "Stripe Not Configured"

This means the `VITE_STRIPE_PUBLISHABLE_KEY` environment variable is not set.

**Solutions:**
1. Check that you created `.env` or `.env.development` in the `client/` directory
2. Verify the variable name starts with `VITE_`
3. Restart your Vite dev server after adding the variable
4. Check the browser console for any loading errors

### Error: "WARNING: STRIPE_SECRET_KEY not found"

This means the backend Stripe secret key is not configured.

**Solutions:**
1. Check that you added `STRIPE_SECRET_KEY` or `STRIPE_SECRET` to `server/.env.development`
2. Restart your server after adding the variable
3. Check server logs for environment variable loading messages

### Payment Form Not Loading

If the payment form shows "Loading payment form..." indefinitely:

1. Check browser console for errors
2. Verify your Stripe publishable key is correct
3. Check network tab for blocked requests
4. Try refreshing the page

## Test Cards (IMPORTANT: Use These for Testing!)

**You should NEVER use your real credit card for testing!** Stripe provides test card numbers that work only in test mode.

### How to Use Test Cards

1. **Make sure you're using TEST keys** (keys starting with `pk_test_` and `sk_test_`)
2. **Use these test card numbers** in the payment form:

#### Successful Payment
- **Card Number:** `4242 4242 4242 4242`
- **Expiry Date:** Any future date (e.g., `12/34` or `12/25`)
- **CVC:** Any 3 digits (e.g., `123` or `999`)
- **ZIP Code:** Any 5 digits (e.g., `12345`)

#### Declined Payment (for testing error handling)
- **Card Number:** `4000 0000 0000 0002`
- **Expiry Date:** Any future date
- **CVC:** Any 3 digits
- **ZIP Code:** Any 5 digits

#### Requires Authentication (3D Secure)
- **Card Number:** `4000 0025 0000 3155`
- **Expiry Date:** Any future date
- **CVC:** Any 3 digits
- **ZIP Code:** Any 5 digits
- **Note:** This will trigger a 3D Secure authentication flow

#### Other Useful Test Cards

- **Insufficient Funds:** `4000 0000 0000 9995`
- **Card Declined (Generic):** `4000 0000 0000 0002`
- **Processing Error:** `4000 0000 0000 0119`
- **Expired Card:** `4000 0000 0000 0069`

### Complete List of Test Cards

For a full list of test cards and scenarios, visit:
- [Stripe Test Cards Documentation](https://stripe.com/docs/testing#cards)

### Important Notes

- ✅ **Test cards ONLY work with test API keys** (`pk_test_...` and `sk_test_...`)
- ✅ **No real money is charged** when using test cards
- ✅ **You can use any name, address, or ZIP code** with test cards
- ❌ **Test cards will NOT work with live keys** (`pk_live_...` and `sk_live_...`)
- ❌ **Never use your real credit card** in test mode - it won't work anyway!

## Security Notes

- **Never commit** `.env` files or API keys to version control
- Use test keys for development
- Only use live keys in production environments
- Rotate keys if they're accidentally exposed
- Use environment variables, never hardcode keys in source code

## Production Deployment

For production:

1. Set environment variables in your hosting platform (AWS, Heroku, etc.)
2. Use live API keys (`pk_live_...` and `sk_live_...`)
3. Ensure HTTPS is enabled (Stripe requires HTTPS in production)
4. Set up webhooks for payment status updates (optional but recommended)

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com)

