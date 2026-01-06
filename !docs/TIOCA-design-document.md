# TIOCA Design Document (Tapioca Pod Hotel, Japan)

Single-property concept: a tapioca-inspired pod hotel in Japan. Emphasis on calm, soft, tactile visuals (pearlescent beads, milk-tea neutrals, deep tea accents) and efficient micro-stay flows. Roles: Guest, Hotel Manager.

## Pod Hotel Research

- Typical offerings
  - Sleeping pods/capsules with privacy screens, ventilation, charging, small shelf, light controls.
  - Gender-zoned or mixed floors; quiet hours and no-shoes rules; lockers for luggage; shared showers (sauna amenity?), powder rooms, laundromat; light breakfast/late-night snacks; lounge/cowork tables; vending/merch.
  - Booking patterns: nightly and short-stay blocks (3–6h); upsells (linen upgrades, aromatherapy, earplugs, pajamas), towel rentals, amenity kits; late check-in lockers; contactless check-in/out.
  - Info guests expect: floor map, pod dimensions, locker sizing, shower count, quiet hours, luggage rules, check-in/out times, Wi‑Fi speed, nearby transport, cleanliness ratings.
- Example operators to study
  - Nine Hours (9h) capsule hotels
  - First Cabin smart pods
  - The Millennials / Smart Pod hotels
  - Capsule Hotel Anshin Oyado Premier
- Example booking flows to observe
  - Brand sites for Nine Hours and First Cabin (direct booking UX, pod selection, add-ons).
  - Aggregators: Booking.com and Agoda searches for “capsule hotel Tokyo” to see filters, photos, amenity tags, cancellation policies.
  - Hostelworld capsule listings (focus on shared-facility disclosures and reviews).

## Property Specifications

### Pod Types & Dimensions

Total capacity: 100 pods across 4 floors (25 pods per floor)

**Baseline assumptions**

- Guest height up to ~6'2" (188 cm)
- Carry-on luggage stored outside pod unless otherwise noted
- All dimensions in inches: Length × Width × Height

**Pod lineup**

1. **Classic Pearl** (Standard)

   - Dimensions: 80" × 40" × 40"
   - Positioned as entry-level option
   - Cozy sleeping capsule with essential amenities

2. **Milk Pearl** (Standard+)

   - Dimensions: 84" × 42" × 45"
   - Slightly taller and more spacious than Classic
   - Enhanced headroom and comfort

3. **Golden Pearl** (Premium)

   - Dimensions: 86" × 45" × 50"
   - Can sit upright comfortably
   - Includes small side cubby for personal items
   - Ideal for longer stays or business travelers

4. **Twin Pearl** (Couples)

   - Dimensions: 86" × 70" × 50"
   - Snug accommodation for two (not spacious)
   - Located on couples floor

5. **Crystal Boba Suite** (First Class)

   - Dimensions: 90" × 55" × 65"
   - Allows standing room
   - Features fold-down desk
   - More like a micro hotel room experience
   - Premium tier with enhanced privacy

6. **Matcha Pearl** (Women Only)
   - Dimensions: 86" × 45" × 50"
   - Same specs as Golden Pearl
   - Exclusive to women-only floor
   - Enhanced security and privacy

### Floor Organization

The property features 4 distinct floors, each with 25 pods:

- **Women-Only Floor**: Matcha Pearl pods with dedicated facilities
- **Men-Only Floor**: Mix of Classic, Milk, and Golden Pearl options
- **Couples Floor**: Twin Pearl pods for shared stays
- **Quiet/Business Floor**: Golden Pearl and Crystal Boba Suites with workspace-friendly environment

### Amenities

**Baseline amenities** (included for all guests)

_In-Pod Features_

- Fresh linen and bedding
- Reading light with adjustable brightness
- Privacy curtain/screen
- Air conditioning and ventilation controls
- Basic USB charging ports (USB-A)
- Small shelf and hooks
- Individual climate control

_Shared Facilities_

- Free high-speed Wi-Fi throughout property
- Hot showers (gender-separated, multiple stalls per floor)
- Powder rooms with mirrors and outlets
- Security lockers with key card access (standard size) (per floor)
- Luggage storage area
- Vending machines featuring tapioca pudding, boba drinks, and snacks
- 24-hour security monitoring and staff
- Shoe storage cubbies (no-shoes policy in pod areas)

_Guest Services_

- Contactless check-in/out options
- Digital key card access
- Emergency call buttons in pod areas
- Free toiletries (basic shampoo, body wash)

**Premium amenities** (bundled with advanced pods or available as add-ons)

_Enhanced In-Pod Features_

- Private lockers (larger, in-pod storage) — Golden Pearl and above
- USB-C fast charging and power outlets — Crystal Boba Suite
- Aromatherapy diffuser options
- Premium sleep kit (earplugs, eye mask, slippers)
- Fold-down workspace — Crystal Boba Suite only

_Enhanced Facilities_

- Premium lounge access (coworking tables, quiet seating, beverages)
- Self-catering kitchen access (microwave, kettle, refrigerator)
- Laundry service and coin-operated washers/dryers
- Towel upgrades (premium cotton, extra towels, bathrobes)
- Private shower rooms (bookable by the hour)

_Enhanced Services_

- Early check-in / late check-out privileges
- Breakfast service or meal kit delivery
- Wake-up call service
- Luggage forwarding assistance
- Local area concierge recommendations

## Development Groups

### A. User Management (Auth, Roles, Profiles)

- OAuth2 sign-in/up (Google, Facebook); roles: Guest, Hotel Manager.
- Role-based access control: guests book/manage stays; managers edit rooms, amenities, availability, oversee reservations, users, transactions.
- Profile pages: personal info, saved bookings, payment methods (tokenized), stay preferences (quiet pod, upper/lower, amenities), communication and marketing consents.
- Session handling: warning and save-draft on expiration; re-auth prompts during checkout if idle.

### B. Guest-Facing Experience (Booking Funnel)

- Global navigation: Hotels (single property home), Rooms/Pods, Amenities, Offers, Gallery, Location/Access, Help, Manage Reservation, Sign In.
- Landing (home) tuned to tapioca theme: hero with quick search (dates, guests, pod type), pod dimensions callout, quiet-hours badge, access map, “How pods work” explainer, amenity grid, offers strip.
- Search/listing: in a single property context, show pod types as cards; filters for pod type (standard, premium, women-only), price, refundability, quiet-zone, accessibility, add-on bundles; optional map for nearby transit.
- Pod detail: gallery (pods, lockers, showers), specs (size, ventilation, charger types), policies (quiet hours, shoe policy), amenities, floor map, availability widget.
- Booking/checkout: stepper (Details → Add-ons → Payment → Confirm); supports short-stay vs overnight selector; add-ons (amenity kit, pajamas, breakfast, storage); price breakdown with taxes/fees; room hold indicator.
- Confirmation: reservation summary, QR/locker code (if applicable), check-in instructions, access map, manage reservation link.
- Manage Reservation (guests): view/modify dates within policy, change pod type, add/cancel add-ons, cancel bookings (policy-aware), resend confirmation email, view payment status.

### C. Room Management (Manager)

- CRUD for pod types: name, description, price, capacity (enforce max guest count), gender-zone flag, accessibility flag, amenities, images, availability rules, blackout dates.
- Real-time availability updates reflected on frontend; bulk updates for maintenance blocks.
- Capacity enforcement in booking flow; validation on concurrent holds.

### D. Reservation Management (Guests & Manager)

- Booking creation: select dates, pod type, guests; prevent overbooking via availability check and optimistic locking.
- Manager dashboard: search/filter reservations by date range, pod type, status; view details (guest info, payment status, add-ons); modify or cancel within policy; resend confirmations.
- History: upcoming/past reservations visible to guests; audit trail for manager changes.

### E. Payments & Transactions

- Stripe integration preferred: cards and digital wallets; tokenized storage for saved methods; payment intents per booking; webhooks for status updates.
- Simulated payments supported for sandbox with transaction IDs and statuses.
- Refunds and voids for cancellations; receipts via email; managers can view transaction ledger, statuses, and export basic financial reports.

### F. UI/UX & Error Handling

- Responsive layouts for mobile-first (pods are micro-rooms; emphasize vertical stacking); sticky booking widget on key pages.
- Intuitive navigation with breadcrumbs in manager areas; clear labels for pod types and policies.
- Search and filter UX: inline chips, collapsible filters for mobile; clear empty states.
- Error states: overbooking conflict, payment failures with retry, expired session save-and-restore, invalid card details, add-on availability changes.
- Accessibility: keyboard-friendly forms, clear contrast, aria labels, focus states; note gender-zoned floors and accessible pod options.

## Page/Feature Inventory (by group)

- Auth & Profile
  - OAuth2 sign-in/up, role-aware redirects; profile management; saved payments (token refs); preference storage.
- Guest Booking Flow
  - Home/landing; pod listing/search; pod detail; booking/checkout; confirmation; manage reservation.
- Manager Console
  - Pod type management; availability calendar/blackouts; reservation search/detail; add-on catalog; basic reports (capacity, revenue snapshot); transaction ledger, refunds, and policy settings (cancellation, quiet hours defaults, add-on limits).
- Shared Components
  - Quick booking widget; price breakdown; add-on picker; availability indicator; alert/toast system; policy banners (quiet hours, shoe rules, gender zones).

## Thematic Direction (Tapioca)

- Visuals: warm beige and tea-brown palette with pearl highlights; soft rounded cards; dotted/bubble dividers evoking tapioca pearls; gentle gradients for surfaces.
- Motion: subtle rising bubble animation on hero load; micro-interactions on add-on selection; calm hover states.
- Copy tone: calming, tidy, courteous; emphasize rest, cleanliness, and efficient stays.

## Edge Cases & Safeguards

- Overbooking: atomic availability checks, short hold during payment, clear retry if conflict.
- Payment failures: retry with saved method, alternate method, or switch to pay-on-arrival (if allowed); webhook reconciliation.
- Session expiration: warn before expiry, autosave booking state; re-auth without losing cart.
- Policy enforcement: cancellation windows, capacity checks, check-in time windows for short stays.
