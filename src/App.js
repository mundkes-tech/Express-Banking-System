import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Home from './pages/Home';
import CreateAccount from './pages/CreateAccount';
import Dashboard from './pages/Dashboard';
import TransferFunds from './pages/TransferFunds';
import CheckBalance from './pages/CheckBalance';
import Login from './pages/Login';
import Register from './pages/Register';
import TransactionHistory from './pages/TransactionHistory';
import PendingApprovals from './pages/PendingApprovals';
import KYCVerify from './pages/KYCVerify';
import KYCSubmit from './pages/KYCSubmit';
import AuditLogs from './pages/AuditLogs';
import CustomerManagement from './pages/CustomerManagement';
import DepositFunds from './pages/DepositFunds';
import WithdrawFunds from './pages/WithdrawFunds';
import EmployeeManagement from './pages/EmployeeManagement';
import ManagerReports from './pages/ManagerReports';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Toast />
          <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/create-account"
            element={<ProtectedRoute><CreateAccount /></ProtectedRoute>}
          />
          <Route
            path="/open-account"
            element={<ProtectedRoute><CreateAccount /></ProtectedRoute>}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/transfer"
            element={<ProtectedRoute><TransferFunds /></ProtectedRoute>}
          />
          <Route
            path="/balance"
            element={<ProtectedRoute><CheckBalance /></ProtectedRoute>}
          />
          <Route
            path="/transactions"
            element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>}
          />
          <Route
            path="/pending-approvals"
            element={<ProtectedRoute><PendingApprovals /></ProtectedRoute>}
          />
          <Route
            path="/kyc-verify"
            element={<ProtectedRoute><KYCVerify /></ProtectedRoute>}
          />
          <Route
            path="/kyc-submit"
            element={<ProtectedRoute><KYCSubmit /></ProtectedRoute>}
          />
          <Route
            path="/audit-logs"
            element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>}
          />
          <Route
            path="/reports"
            element={<ProtectedRoute><ManagerReports /></ProtectedRoute>}
          />
          <Route
            path="/customer-management"
            element={<ProtectedRoute><CustomerManagement /></ProtectedRoute>}
          />
          <Route
            path="/deposit"
            element={<ProtectedRoute><DepositFunds /></ProtectedRoute>}
          />
          <Route
            path="/withdraw"
            element={<ProtectedRoute><WithdrawFunds /></ProtectedRoute>}
          />
          <Route
            path="/employees"
            element={<ProtectedRoute allowedRoles={['admin']}><EmployeeManagement /></ProtectedRoute>}
          />
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
