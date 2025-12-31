# Frontend Design Overview (TIOCA Hotel)

Design goal: calming, nature-forward, welcoming. Pages are grouped by **Guests (customers)**, **Partners**, and **Hotel Managers**, with **Shared/Public** pages and reusable UI components.

## Global Navigation

### Site Navigation (role-aware)

- **Primary nav items (guest):** Stay / Rooms, Offers, Experiences, Amenities, Gallery, Location, Help, Manage Reservation, Sign In/Up (OAuth)

- **Primary nav items (partner):** Partner Portal, Listings, Reservations, Payouts, Support, Promotions

- **Primary nav items (manager):** Dashboard, Operations, Inventory, Reservations, Guests, Staff, Reports, Settings

- **Sticky header (all guest-facing pages)**

  - Logo (left), main nav, “Book” CTA
  - **Quick booking widget** (dates + guests + promo code) on relevant pages
  - Account menu / language / currency (optional)

- **Footer (all public pages)**
  - Contact, address/map link, policies, accessibility, social, newsletter signup
  - Partner portal link, careers link, press link

## Guest (Customer) Pages

### Authentication & Onboarding

#### OAuth Sign In/Up Page

**Purpose:** authentication

#### Post-Login Welcome / Profile Capture

**Purpose:** collect lightweight profile info for analytics + personalization.
**Elements:**

- Welcome header (“Welcome to TIOCA”)

- Progressive form (keep optional where possible):

  - Travel intent: business / leisure / family / couple / solo
  - Interests: spa/wellness, outdoors, dining, events
  - Preferences: bed type, accessibility needs, pet-friendly, quiet room
  - Optional: birthday month (for offers), home region (coarse), communication prefs

- Consent toggles:

  - Marketing emails/SMS opt-in

- “Skip for now” option (with clear impact)
- “Continue to booking” CTA and/or “Go to dashboard”

### Landing Page (Home)

**Purpose:** brand story + quick path to booking.
**Content & elements:**

- Sticky header with **quick search** (check-in/out, guests, rooms, promo code)
- Highlights: “Why TIOCA” (calm, wellness, nature, service)
- Featured rooms (3–6 cards): photo, starting price, key amenities
- Experiences/amenities teasers (spa, dining, trails, pool, events)
- Offers strip (seasonal deals, packages)
- Social proof: ratings, testimonials, press mentions

### Hotel Search / Listing Page

**Purpose:** browse and filter properties.
**Elements:**

- Search bar with location, dates, guests
- Filters: price, rating, amenities, accessibility, bed type, policies
- Sort: recommended, price, rating, distance
- Property cards: image, name, rating, top amenities, price/night, “View rooms”

### Property Detail Page (Hotel Overview)

**Purpose:** sell the property, then route to room selection.
**Elements:**

- Sticky header with booking widget
- Photo gallery carousel + video (optional)
- Overview: description, check-in/out, policies
- Amenities list
- Experiences/events (yoga, tours, etc.)
- Details: Dining section (hours, menu links), Accessibility information
- Reviews summary
- Location + transportation details
- CTA: “Select dates to see rooms”

### Rooms & Rates Page (Room Selection)

**Purpose:** show availability and convert.
**Elements:**

- Date/guest selector (sticky on scroll)
- Rate filters: refundable, breakfast included, member rates, packages

- Room cards:

  - Images, name, occupancy, bed type, size, amenities
  - Price breakdown (nightly + taxes/fees) and cancellation policy
  - “Select” / “Compare” buttons

- Compare drawer (optional)
- Sold-out waitlist / “notify me” (optional)
- Accessibility room flags

### Booking Page (Checkout)

**Purpose:** complete purchase.
**Elements:**

- Stepper: Details → Add-ons → Payment → Confirm
- Guest details form (name, email, phone, special requests)
- Add-ons: breakfast, parking, spa credits, late checkout
- Payment: card fields, billing address, saved payment (if logged in)
- Promo code input and validation

- Booking summary sidebar:

  - Dates, guests, room, add-ons, taxes/fees, total
  - **Room hold/lock indicator** with countdown

- **Partner Promotions module (at end of booking)** _(cross-role integration)_

  - “Exclusive local offers” section shown after payment details or right before confirm
  - Offer cards: partner name, offer description, eligibility tags, redemption method
  - Selection: “Add to my stay” (adds voucher/QR to confirmation)
  - Limits: max one / max N, expiry date, availability

- Confirmation modals + error states (payment failed, room no longer available)

### Booking Confirmation Page

**Purpose:** reassure + provide next steps.
**Elements:**

- Confirmation number + QR code (optional)
- Reservation summary + receipt download/email
- “Add to calendar” (optional)
- Directions, check-in instructions, contact info
- Upsell: experiences / upgrades
- **Partner offers included** (vouchers/QR codes + redemption steps)
- “Manage reservation” CTA

### Reservation Finder Page (No Account)

**Purpose:** allow guests to retrieve bookings.
**Elements:**

- Inputs: confirmation + email/phone OR name + dates
- Verification step (one-time code) if needed
- Results list + detail view

- Actions:
  - Modify dates (if allowed)
  - Upgrade room / add-ons
  - Cancel (policy-aware)
  - Resend confirmation

### Account (Guest) Pages

** Guest Dashboard**

- Upcoming stays, past stays
- Saved preferences (pillow, accessibility needs)
- Saved payment methods (if supported)
- Saved partner offers / vouchers (if applicable)

**Reservation Detail (Logged-in)**

- Modify/cancel, add-ons, messages to hotel
- Partner vouchers attached to reservation
- Digital check-in (optional)

**Profile & Preferences**

- Personal info, communication preferences
- Accessibility preferences, dietary notes (optional)
- Personalization toggles (analytics/marketing preferences)

### Support & Policy Pages (Guest) ??

Contact Us, FAQ, Policies, Privacy, Terms, Accessibility, Cookie Preferences

## Partner Pages (Partner Portal)

### Partner Landing (Public) ??

- What partnership means, benefits, requirements
- “Apply” CTA + login link

### Partner Authentication

- Sign in, MFA (optional), reset password

### Partner Dashboard

- Snapshot: active listings, bookings, revenue, notifications
- Tasks: respond to issues

### Listings Management

- Create/edit listing (rooms or allocations) for all properties
- Availability calendar, blackout dates

### Reservations (Partner View)

- Reservation list with filters
- Reservation detail: guest info (limited), dates, status, payouts

### Payouts & Invoices

- Earnings overview, payout schedule
- Export CSV/PDF ??

### Promotions — Partner Deals Management

**Purpose:** partners create and control offers shown to guests near the end of booking.
**Elements:**

- Promotions table: name, status (draft/active/paused), eligibility, date range, impressions cap, redemptions, CTR
- Filters: active, expired, paused, customer type, date range

#### Create/Edit Promotion

**Core fields:**

- Offer title + short description + terms
- Offer type: % off, fixed discount, free item, bundle, “experience”
- Redemption method: QR code, code, link, “show confirmation”
- Validity window: start/end dates + blackout dates
- Targeting rules:

  - Customer type (e.g., leisure/business/family)
  - Booking attributes (stay length, room tier, party size)
  - New vs returning guests (if supported)
  - Optional geo/season tags

- Delivery rules:

  - Max appearances (impression cap)
  - Max redemptions
  - Priority / weighting

- Media: logo, image, brand color (optional)
- Compliance: required disclaimers

#### 8.3 Promotion Analytics

- Views/impressions, clicks, add-to-stay, redemptions (if tracked)
- Time-series chart + export

### Hotel Management

- CRUD for all hotel details, amenities, policies
- Manage room types, pricing, availability

## Hotel Manager Pages (Manager Portal)

(unchanged list, but add visibility controls as needed - limited to assigned properties)

## Shared Components & UX Patterns

### Promotions Components (NEW)

- Offer card (compact + expanded)
- Eligibility tags (family-friendly, wellness, dining, etc.)
- Voucher/QR renderer for confirmation + reservation detail
- Admin moderation badge/status (if managers review offers)

## Color Palette & Branding

### Primary actions

color-primary

- Main actions: primary buttons, active toggles, highlights.

color-accent/secondary

- Limited emphasis: “Book Now” alternate CTA, offer badges, small highlights.

### Surfaces

color-bg

- main page background

color-surface

- cards/containers

color-surface-2

- alternate section background

color-overlay

- dropdown/modal surface (can equal surface)

### UI states

Use these across toasts, alerts, badges, validation:

- color-success

- color-warning

- color-danger

- color-info
