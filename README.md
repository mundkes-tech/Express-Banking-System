# Express Banking System

A full-stack banking system built with React, Express, and MongoDB with JWT authentication, validated APIs, and persistent transaction history.

## Features

- User registration and login with hashed passwords and JWT auth
- Protected banking APIs (per-user account ownership)
- Create account with account type (SAVINGS/CHECKING)
- Dashboard listing account number, type, status, and balance
- Transfer funds between your own accounts
- Deposit and withdraw operations
- Balance lookup and transaction history
- Account update and delete endpoints
- Security middleware: helmet, rate limiting, validation, request logging

## Tech Stack

- Frontend: React, React Router, Axios
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- Auth/Security: JWT, bcryptjs, helmet, express-rate-limit, express-validator

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/express_bank
JWT_SECRET=replace_with_strong_secret
CLIENT_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000/api
```

## Run Locally

Install dependencies:

```bash
npm install
```

Run backend + frontend together:

```bash
npm run dev
```

Or run separately:

```bash
npm run server
npm start
```

## Deployment Guide

### Backend on Render

1. Create a new **Web Service** on Render and connect this GitHub repository.
2. Set the **Root Directory** to `backend`.
3. Use these values for the service:

```text
Build Command: npm install
Start Command: npm start
```

4. Add the following environment variables in Render:

```env
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-strong-secret>
CLIENT_URL=<your-netlify-site-url>
```

5. Deploy the service and copy the Render backend URL.

### Frontend on Netlify

1. Create a new site on Netlify and connect the same GitHub repository.
2. Set the **Base directory** to `frontend`.
3. Use these build settings:

```text
Build command: npm run build
Publish directory: build
```

4. Add this environment variable in Netlify:

```env
REACT_APP_API_URL=https://express-banking-system.onrender.com/api
```

5. Deploy the site and verify it can reach the backend API.

### Important Deployment Notes

- Update `CLIENT_URL` in the backend to the final Netlify domain so CORS works correctly.
- Keep `REACT_APP_API_URL` pointed to the deployed backend, not localhost.
- If you change the frontend domain later, update the backend environment variable again.
- MongoDB must be reachable from Render, so use MongoDB Atlas or another hosted MongoDB instance.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Bank (Protected: Bearer token required)

- `POST /api/bank/create`
- `GET /api/bank/accounts`
- `POST /api/bank/transfer`
- `POST /api/bank/deposit`
- `POST /api/bank/withdraw`
- `GET /api/bank/balance/:accountNumber`
- `GET /api/bank/transactions/:accountNumber`
- `PATCH /api/bank/accounts/:accountNumber`
- `DELETE /api/bank/accounts/:accountNumber`

## Notes

- Backend data is now persistent in MongoDB.
- All bank operations are scoped to the authenticated user.
- Frontend routes for account actions are protected via login.