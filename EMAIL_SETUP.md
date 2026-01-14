# Email Setup Guide for TIOCA Hotel

This guide explains how to configure and use the email functionality in the TIOCA Hotel booking system.

## Overview

The email system provides two key features:

1. **Booking Confirmation Emails** - Sent automatically after successful payment
2. **Guest Reservation Access** - Allows guests without accounts to securely access their reservations

---

## Email Service Options

### Option 1: Gmail SMTP (Recommended for Development)

**Pros:**
- Free and easy to set up
- Good for development and testing
- No API key required

**Cons:**
- Gmail has daily sending limits (500 emails/day)
- May trigger spam filters if not configured properly

**Setup Steps:**

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password:**
   - Go to Google Account Settings → Security
   - Under "2-Step Verification", click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "TIOCA Hotel"
   - Copy the generated 16-character password

3. **Configure Environment Variables:**
   ```env
   EMAIL_PROVIDER=nodemailer
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=TIOCA Pod Hotel
   SUPPORT_EMAIL=support@tioca.com
   FRONTEND_URL=http://localhost:5173
   ```

### Option 2: SendGrid (Recommended for Production)

**Pros:**
- Free tier: 100 emails/day
- Professional deliverability
- Email analytics and tracking
- Easy spam filter bypass

**Cons:**
- Requires API key setup
- Domain verification recommended

**Setup Steps:**

1. **Sign up** at [SendGrid](https://sendgrid.com/)
2. **Create API Key:**
   - Go to Settings → API Keys
   - Create a new API Key with "Full Access"
   - Copy the key (you won't see it again!)

3. **Verify Sender Identity:**
   - Go to Settings → Sender Authentication
   - Verify a single sender email address

4. **Configure Environment Variables:**
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your-api-key-here
   FROM_EMAIL=verified-email@yourdomain.com
   FROM_NAME=TIOCA Pod Hotel
   SUPPORT_EMAIL=support@tioca.com
   FRONTEND_URL=https://tioca.com
   ```

5. **Update EmailService** (server/src/services/email.service.js):
   ```javascript
   // Add SendGrid configuration to initializeTransporter()
   if (emailProvider === "sendgrid") {
       const sgMail = require('@sendgrid/mail');
       sgMail.setApiKey(process.env.SENDGRID_API_KEY);
       this.transporter = sgMail;
   }
   ```

### Option 3: AWS SES (Best for AWS Deployments)

**Pros:**
- Very cheap ($0.10 per 1,000 emails)
- Highly scalable
- Integrates with existing AWS infrastructure

**Cons:**
- Starts in "sandbox mode" (limited sending)
- Requires domain verification
- More complex setup

**Setup Steps:**

1. **Enable AWS SES** in your AWS region
2. **Verify Domain or Email:**
   - Go to SES → Verified Identities
   - Add and verify your domain (preferred) or email

3. **Request Production Access:**
   - Go to SES → Account Dashboard
   - Request production access (removes sandbox limits)

4. **Get Credentials:**
   - Create IAM user with SES sending permissions
   - Save Access Key ID and Secret Access Key

5. **Configure Environment Variables:**
   ```env
   EMAIL_PROVIDER=ses
   AWS_SES_REGION=us-east-1
   AWS_SES_ACCESS_KEY=your-access-key-id
   AWS_SES_SECRET_KEY=your-secret-access-key
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=TIOCA Pod Hotel
   SUPPORT_EMAIL=support@tioca.com
   FRONTEND_URL=https://tioca.com
   ```

---

## Features

### 1. Booking Confirmation Emails

**When it's sent:** Automatically after successful payment in `PaymentService.confirmPayment()`

**Content includes:**
- Confirmation code (e.g., TIOCA-ABC123)
- Booking summary (dates, pod type, floor)
- Guest information
- Payment summary with total paid
- Check-in instructions
- Important policies (quiet hours, shoe policy)
- "Manage Reservation" link

**Template:** `server/src/templates/email/booking-confirmation.html`

### 2. Reservation Verification Emails

**When it's sent:** When a guest without an account requests to view their reservation

**Content includes:**
- Verification link (expires in 15 minutes)
- 6-digit backup code
- Security notice
- Link to request new verification

**Template:** `server/src/templates/email/verification.html`

**Flow:**
1. Guest visits `/reservations/lookup`
2. Enters email + confirmation code
3. Clicks "Send Verification Email"
4. Receives email with magic link
5. Clicks link → automatically verified and shown reservation

---

## Database Models

### EmailVerificationToken

Stores verification tokens for guest reservation access:

```javascript
{
  email: String,              // Guest email (lowercase)
  reservationId: ObjectId,    // Reference to reservation
  token: String,              // 64-char hex token (hashed)
  code: String,               // 6-digit numeric code
  purpose: String,            // "reservation_access"
  expiresAt: Date,            // 15 minutes from creation
  used: Boolean,              // One-time use
  usedAt: Date
}
```

**Indexes:**
- email
- token (unique)
- reservationId
- expiresAt (TTL - auto-deletes expired tokens)

### Reservation Model Updates

Added fields:
```javascript
{
  confirmationCode: String,        // e.g., "TIOCA-ABC123" (unique)
  confirmationEmailSentAt: Date,   // Timestamp of last email
  lastAccessedAt: Date             // When guest last viewed reservation
}
```

---

## API Endpoints

### Guest Verification Endpoints (Public)

#### POST `/api/reservations/request-access`
Request verification email for reservation access

**Body:**
```json
{
  "email": "guest@example.com",
  "confirmationCode": "TIOCA-ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox.",
  "expiresInMinutes": 15
}
```

#### GET `/api/reservations/verify/:token`
Verify magic link token from email

**Response:**
```json
{
  "success": true,
  "reservation": { ... },
  "token": "verification-token-for-continued-access"
}
```

#### POST `/api/reservations/verify-code`
Verify 6-digit code manually

**Body:**
```json
{
  "email": "guest@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "reservation": { ... }
}
```

#### POST `/api/reservations/lookup`
Simple lookup without email verification (less secure)

**Body:**
```json
{
  "email": "guest@example.com",
  "confirmationCode": "TIOCA-ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "reservation": { ... }
}
```

---

## Frontend Pages

### 1. Reservation Lookup (`/reservations/lookup`)
- Form: Email + Confirmation Code
- Two options:
  1. **Simple Lookup** - Direct access (less secure)
  2. **Send Verification Email** - More secure

### 2. Reservation Verify (`/reservations/verify/:token`)
- Handles magic link verification
- Auto-verifies token and redirects to reservation view
- Shows error if token expired/invalid

### 3. Guest Reservation View (`/reservations/guest/view`)
- Displays full reservation details
- Similar to authenticated user's reservation view
- Shows check-in instructions, policies, payment info

---

## Security Considerations

### Rate Limiting
- Max 5 verification requests per email per hour
- Prevents spam and abuse

### Token Security
- Tokens are 64-character random hex strings
- Stored hashed in database (currently plain - consider bcrypt)
- Single-use tokens (marked as used after verification)
- 15-minute expiration
- Automatic cleanup via MongoDB TTL index

### Email Validation
- Validates email format
- Checks email matches reservation
- Case-insensitive email comparison

### Best Practices
1. Always use HTTPS in production
2. Set strong `SESSION_SECRET`
3. Use environment variables for all credentials
4. Enable domain verification for production emails
5. Monitor email deliverability and spam reports

---

## Testing

### Development Mode
If email credentials are not configured, emails will be logged to console instead:

```
📧 [DEV MODE] Email Preview:
To: guest@example.com
Subject: Booking Confirmed - TIOCA Pod Hotel (TIOCA-ABC123)
Text: [email content]
```

### Testing with Real Email

1. **Set up Gmail SMTP** (see Option 1 above)
2. **Make a test booking:**
   ```bash
   # Start the server
   cd server
   npm start
   
   # In another terminal, start the frontend
   cd client
   npm run dev
   ```

3. **Complete a booking** through the UI
4. **Check your email** for the confirmation
5. **Test guest access:**
   - Go to `/reservations/lookup`
   - Enter email and confirmation code
   - Request verification email
   - Check email for magic link or 6-digit code

### Verify Email Service Connection

Run this test in your server:

```javascript
import EmailService from './services/email.service.js';

EmailService.verifyConnection()
  .then(valid => {
    if (valid) {
      console.log('✅ Email service is working!');
    } else {
      console.error('❌ Email service not configured');
    }
  });
```

---

## Troubleshooting

### Emails Not Sending

1. **Check environment variables:**
   ```bash
   echo $SMTP_USER
   echo $SMTP_PASSWORD
   ```

2. **Verify email service connection:**
   - Check server logs for email errors
   - Ensure firewall allows outbound SMTP (port 587)

3. **Gmail-specific issues:**
   - Make sure 2FA is enabled
   - Use App Password, not your regular password
   - Check "Less secure app access" is NOT blocking it

### Emails Going to Spam

1. **Add SPF record** to your domain:
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **Add DKIM** (if using SendGrid/SES)
3. **Verify sender domain** (not just email)
4. **Avoid spam trigger words** in subject/content
5. **Include unsubscribe link** (for marketing emails)

### Verification Links Not Working

1. **Check FRONTEND_URL** environment variable
2. **Ensure token hasn't expired** (15 min limit)
3. **Check if token was already used** (single-use)
4. **Verify routes are correctly set up** in App.tsx

---

## Customization

### Modify Email Templates

Templates are in `server/src/templates/email/`:

- `booking-confirmation.html` - Confirmation email
- `verification.html` - Verification email

**Variables available:**
- `{{guestName}}` - Guest's name
- `{{confirmationCode}}` - Reservation code
- `{{checkInDate}}` - Formatted check-in date
- `{{verificationUrl}}` - Magic link URL
- etc.

**Styling tips:**
- Use inline CSS (email clients don't support external stylesheets)
- Test on multiple email clients (Gmail, Outlook, Apple Mail)
- Use `{{#if variable}}...{{/if}}` for conditionals

### Add New Email Types

1. **Create template** in `server/src/templates/email/new-template.html`
2. **Add method** to `EmailService`:
   ```javascript
   async sendNewEmail(data) {
     const html = await this.loadTemplate('new-template', data);
     await this.sendEmail({
       to: data.email,
       subject: 'Your Subject',
       html
     });
   }
   ```

3. **Call method** where needed in your service/controller

---

## Production Checklist

- [ ] Switch to SendGrid or AWS SES
- [ ] Verify sender domain (not just email)
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Use strong `SESSION_SECRET`
- [ ] Enable HTTPS
- [ ] Add SPF/DKIM records
- [ ] Test email deliverability
- [ ] Monitor email bounce rates
- [ ] Set up email sending queue (optional)
- [ ] Add email analytics tracking
- [ ] Configure proper error handling and retries

---

## Support

For issues or questions about the email system:

1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test email service connection
4. Review this guide for troubleshooting tips

Need help? Contact the development team or refer to:
- Nodemailer docs: https://nodemailer.com/
- SendGrid docs: https://docs.sendgrid.com/
- AWS SES docs: https://docs.aws.amazon.com/ses/
