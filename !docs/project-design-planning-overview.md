# Project Design Overview

## Hotel Name Ideas

- TIOCA Inn
- TIOCA
- Tapioca
- TeaOCA
- DIOCA (Latin: "of two houses"; refers to plants with separate male and female flowers)

## Theme & Branding Ideas

### 1. Herbal / Flowery / Plant Aesthetic

- Colors: Deep greens, sage, olive, soft browns, muted florals (lavender, chamomile, rose, jasmine)
- Accents: Leafy patterns, botanical illustrations, natural textures (linen, wood)
- Logo: Stylized leaf, flower, or tea plant motif
- Fonts: Handwritten or organic serif fonts
- Mood: Calming, natural, wellness-focused

### 2. Elegant but Inviting

- Colors: Clean whites, gold, warm taupe, soft beige, subtle green or blue accents
- Accents: Minimalist lines, gold or brass details, soft lighting
- Logo: Simple monogram or abstract symbol, possibly with a tea cup or elegant leaf
- Fonts: Modern serif or sans-serif, high contrast
- Mood: Upscale, welcoming, refined comfort

### 3. Modern Minimalist

- Colors: Charcoal, white, slate blue, muted green, blush
- Accents: Geometric shapes, lots of negative space, subtle gradients
- Logo: Abstract geometric or minimalist icon
- Fonts: Clean sans-serif, all-caps for headers
- Mood: Sleek, contemporary, uncluttered

### 4. Cozy Tea House

- Colors: Warm browns, cream, honey yellow, moss green, terracotta
- Accents: Teacup/teapot motifs, cozy textures (knit, woodgrain), hand-drawn icons
- Logo: Whimsical teacup or teapot, steam forming a leaf or flower
- Fonts: Rounded, friendly, slightly playful
- Mood: Homey, comforting, approachable

### 5. Eco-Luxury Retreat

- Colors: Forest green, stone gray, gold, ivory, deep teal
- Accents: Sustainable materials, eco-friendly messaging, luxury touches
- Logo: Elegant leaf or tree, possibly with gold foil effect
- Fonts: Elegant serif with modern sans-serif
- Mood: Exclusive, eco-conscious, tranquil

---

**Tip:** Use [coolors.co](https://coolors.co/) to generate and experiment with palettes.

---

# System Structure

## Front End

### Pages

- **Booking Page**: Search availability, lock rooms during booking
- **Guest Experience**: Site must be usable by non-logged-in users (guests)

## Back End

### Core Documents / Entities

#### User

Single document for all user types (guest, registered, admin, manager, partner).

| Field               | Description                                       |
| ------------------- | ------------------------------------------------- |
| userId              | Unique identifier                                 |
| name                | Full name                                         |
| email               | Email address                                     |
| password (hashed) ? | Hashed password (if not OAuth)                    |
| role                | User role: guest, admin, manager, partner         |
| phone               | Phone number                                      |
| address             | Mailing address                                   |
| payment methods     | Saved payment info                                |
| preferences         | User preferences (e.g., room type, notifications) |
| OAuth provider info | Third-party login details                         |
| session info        | Session/cookie/local storage data                 |

> Role-based access: permissions and access control managed via the `role` field.

#### Location

Hotel/motel property details.

| Field        | Description                      |
| ------------ | -------------------------------- |
| locationId   | Unique identifier                |
| name         | Property name                    |
| address      | Street address                   |
| phone        | Contact phone number             |
| category     | hotel or motel                   |
| amenities    | List of amenities                |
| managerId(s) | UserId(s) of assigned manager(s) |

#### Room

Room details (status is always derived from bookings and locks for a given date range).

| Field       | Description                             |
| ----------- | --------------------------------------- |
| roomId      | Unique identifier                       |
| locationId  | Reference to Location                   |
| type        | Room type (e.g., single, double, suite) |
| description | Room description                        |
| amenities   | List of amenities                       |
| capacity    | Max number of guests                    |
| price       | Price per night                         |
| images      | Array of image URLs                     |

> Room availability for any date range is determined by checking for overlapping Booking or Lock records. No static status field is stored.

#### Booking

Reservation details.

| Field      | Description                   |
| ---------- | ----------------------------- |
| bookingId  | Unique identifier             |
| userId     | Reference to User             |
| roomId     | Reference to Room             |
| locationId | Reference to Location         |
| check-in   | Check-in date                 |
| check-out  | Check-out date                |
| price      | Total price                   |
| status     | pending, confirmed, cancelled |
| paymentId  | Reference to Payment          |
| timestamps | Created/updated times         |

> A booking with status 'confirmed' blocks the room for the specified date range. 'Pending' bookings may also block the room if payment is in progress.

#### Lock

Temporary hold on a room during the booking process.

| Field            | Description                             |
| ---------------- | --------------------------------------- |
| lockId           | Unique identifier                       |
| roomId           | Reference to Room                       |
| userId/sessionId | Reference to User or session for guests |
| locationId       | Reference to Location                   |
| holdStart        | Lock start time                         |
| holdEnd          | Lock expiry time                        |
| createdAt        | Lock creation time                      |

> A lock prevents double-booking by temporarily reserving a room for a user/session while they complete the booking. Locks expire after a set time (e.g., 10 minutes).

#### Payment (probly going to change - dunno Stripe API)

Payment and transaction records.

| Field         | Description                         |
| ------------- | ----------------------------------- |
| paymentId     | Unique identifier                   |
| bookingId     | Reference to Booking                |
| userId        | Reference to User                   |
| amount        | Payment amount                      |
| status        | Payment status                      |
| method        | Payment method (e.g., card, Stripe) |
| transactionId | External transaction reference      |
| createdAt     | Payment creation time               |
| updatedAt     | Last update time                    |

#### Audit Log (optional, basic audit for variety of actions)

| Field      | Description                  |
| ---------- | ---------------------------- |
| logId      | Unique identifier            |
| userId     | Reference to User            |
| action     | Action performed             |
| entityType | Type of entity affected      |
| entityId   | Reference to affected entity |
| timestamp  | When the action occurred     |
| details    | Additional details           |

---

# Stretch Features & Considerations

- **Room Locking**: Implemented via Lock documents, rooms are temporarily held for 10 minutes during booking to prevent double-booking. Locks are checked alongside bookings for availability.
- **Notifications**: Email and/or in-app notifications for booking confirmations, reminders, cancellations
- **User Analytics**: Log user actions to analyze where users abandon signup/booking (for retention improvements)

# Considerations

- **Dynamic Room Status**: Room status (available/booked/locked) is always determined by querying Booking and Lock documents for the requested date range.
- **Guest Tracking**: Use session ID, cookies, or local storage to differentiate guests (especially for non-logged-in users)
- **Role-Based Access**: Permissions for admin, manager, partner, guest, etc.
- **OAuth2 Authentication**: Third-party login (Google, Facebook) for users
- **Payment Processing**: Stripe integration for secure payments, refunds, receipts
- **Guest Reservation Management**: Modify/cancel bookings, view history, confirmation emails
- **Error Handling**: User-friendly error messages, backend error logging
- **Edge Case Handling**: Overbooking prevention, payment failures, session expiration
- **Language & Currency Support**: Multi-language and currency options for international users
- **Upsell & Promotions**: Special offers, partners can manage who shows up, for how long, with what hotels.
