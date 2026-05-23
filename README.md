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