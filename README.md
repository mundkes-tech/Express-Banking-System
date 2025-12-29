# 🚀 Express Banking System

A full-stack banking management application built with React and Express.js, designed to simulate real-world banking operations in a secure, reliable, and user-friendly environment.

This project demonstrates clean architecture, modular backend design, and structured data handling using custom data structures.

## 🌟 Key Features

### 🧾 Account Management
- Create new bank accounts with an initial balance
- Automatically generates a unique account number

### 📊 Interactive Dashboard
- View all accounts in a clean, responsive table
- Displays account number, holder name, and balance

### 💸 Secure Fund Transfers
- Transfer money between accounts
- Validates sufficient balance before processing

### 💰 Balance Inquiry
- Retrieve live account balance by account number

### 🧩 Modern Frontend UI
- Built with React & React Router
- Intuitive navigation and responsive layout

### 🛡️ Robust Backend API
- RESTful Express.js services
- CORS-enabled for cross-origin requests

### 🧠 Custom Data Structures
- In-memory storage using LinkedList
- Object-oriented Account model

## 🛠️ Tech Stack

### 🎨 Frontend
- React
- React Router DOM
- Axios
- Custom CSS

### ⚙️ Backend
- Node.js
- Express.js
- CORS

### 🗂️ Data Structures
- Custom LinkedList
- Account and Node models

## ⚡ Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/express-banking-system.git
cd express-banking-system
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Start Backend Server
```bash
node src/server/server.js
```
Runs at → `http://localhost:5000`

### 4️⃣ Start React App
```bash
npm start
```
Opens at → `http://localhost:3000`

## 📘 Application Usage

### ➕ Create Account
1. Open Create Account
2. Enter:
   - Account holder name
   - Initial balance
3. Submit — account gets generated with a unique ID

### 📂 View Accounts
- Navigate to Dashboard
- View all accounts in a tabular format

### 🔁 Transfer Funds
1. Open Transfer Funds
2. Enter:
   - Sender account number
   - Receiver account number
   - Transfer amount
3. Balance validation ensures safe transactions

### 🔎 Check Balance
1. Open Check Balance
2. Enter account number
3. View current balance instantly

## 🔌 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/bank/create`     | Create new account |
| GET    | `/api/bank/accounts`   | Get all accounts |
| POST   | `/api/bank/transfer`   | Transfer funds |
| GET    | `/api/bank/balance/:accountNumber` | Get account balance |

### 🧪 Example Requests

**Create Account:**
```bash
curl -X POST http://localhost:5000/api/bank/create \
-H "Content-Type: application/json" \
-d '{"name": "John Doe", "balance": 1000}'
```

**Transfer Funds:**
```bash
curl -X POST http://localhost:5000/api/bank/transfer \
-H "Content-Type: application/json" \
-d '{"fromAccount": 1001, "toAccount": 1002, "amount": 500}'
```

## 🗂️ Project Structure
```
expbanksys/
├── public/
├── src/
│   ├── components/
│   ├── controllers/
│   ├── models/
│   ├── pages/
│   ├── routes/
│   ├── server/
│   ├── App.js / App.css
│   └── index.js
└── package.json
```

## 🧪 Testing

Run tests:
```bash
npm test
```

## 🤝 Contributing

1. Fork repo
2. Create feature branch
3. Commit changes
4. Push branch
5. Open Pull Request

## 📜 License

Licensed under the MIT License — see LICENSE for details.

## 📬 Support

For questions, feedback, or feature suggestions — please open an issue in the repository.

---

❤️ Built with passion using React & Express.js