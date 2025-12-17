# Tech Stack Overview for TIOCA Reservation System

This document provides an overview of the technologies used in the TIOCA Reservation System, their roles, and how they will be integrated into the project.

---

## 1. Frontend

### React

- **Role:** Main UI library for building interactive user interfaces.
- **Details:**
  - Component-based architecture for modular, reusable UI.
  - Used with TypeScript for type safety.
  - Responsive design for desktop, tablet, and mobile.

### TypeScript

- **Role:** Superset of JavaScript adding static typing.
- **Details:**
  - Used throughout the frontend for better maintainability and fewer runtime errors.
  - All React components and Redux logic will be written in TypeScript.

### Redux & RTK Query

- **Role:** State management and data fetching.
- **Details:**
  - Redux manages global state (user, bookings, etc.).
  - RTK Query handles API calls and caching.
  - Ensures consistent state and efficient data loading across the app.

---

## 2. Backend

### Node.js & Express

- **Role:** Server-side runtime and web framework.
- **Details:**
  - Express handles routing, middleware, and REST API endpoints.
  - All business logic, authentication, and data validation are implemented here.

### Passport.js (OAuth2)

- **Role:** Authentication and authorization.
- **Details:**
  - Integrates with third-party providers (Google, Facebook) for user login.
  - Manages user sessions and role-based access control.

### Stripe API

- **Role:** Payment processing.
- **Details:**
  - Handles secure payments, refunds, and receipts.
  - Integrates with backend to process transactions and update booking/payment status.

---

## 3. Database

### MongoDB (AWS DocumentDB)

- **Role:** NoSQL database for storing all application data.
- **Details:**
  - Stores users, rooms, bookings, payments, etc.
  - DocumentDB is a managed MongoDB-compatible service on AWS, providing scalability and reliability.
  - Accessed via Mongoose or native MongoDB drivers from the backend.

---

## 4. Deployment & Cloud

### Amazon Web Services (AWS)

- **Role:** Cloud hosting and infrastructure.
- **Details:**
  - **Frontend:** Deployed to AWS S3 (static site hosting) or AWS Amplify.
  - **Backend:** Deployed to AWS Elastic Beanstalk, ECS, or EC2.
  - **Database:** AWS DocumentDB for MongoDB.
  - **Other Services:**
    - AWS Route 53 for DNS management.
    - AWS Certificate Manager for SSL/TLS.
    - AWS IAM for access control.
    - CI/CD pipelines via AWS CodePipeline or GitHub Actions.

#### Deployment Workflow

1. Code is pushed to GitHub.
2. CI/CD pipeline builds and tests the code.
3. Frontend is deployed to S3/Amplify; backend to Beanstalk/ECS.
4. Database is managed via DocumentDB.
5. DNS and SSL managed via Route 53 and Certificate Manager.

---

## 5. Additional Tools & Practices

- **JSDoc/JavaDocs:** For code documentation.
- **SOLID/DRY Principles:** For maintainable, scalable code.
- **Testing:** Jest (frontend/backend), React Testing Library, Supertest (API).
- **Error Handling:** Centralized error middleware in Express, user-friendly messages in frontend.
- **Security:** HTTPS, environment variables, secure authentication, and payment flows.

---

## 6. Project Structure (TBD)

- `/docs` (design docs, tech stack, API docs)
