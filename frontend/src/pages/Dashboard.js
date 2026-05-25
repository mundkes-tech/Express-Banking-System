import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { employee } = useAuth();
  const navigate = useNavigate();

  if (!employee) {
    return <div className="dashboard-container"><p>Loading...</p></div>;
  }

  const renderRoleBoard = () => {
    switch (employee.role) {
      case 'teller':
        return <TellerBoard navigate={navigate} />;
      case 'manager':
        return <ManagerBoard navigate={navigate} />;
      case 'admin':
        return <AdminBoard navigate={navigate} />;
      default:
        return <div className="board"><p>Unknown role</p></div>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {employee.name}</h1>
        <p className="role-badge">{employee.role.charAt(0).toUpperCase() + employee.role.slice(1)} Portal</p>
      </div>
      {renderRoleBoard()}
    </div>
  );
};

const TellerBoard = ({ navigate }) => {
  return (
    <div className="board">
      <h2>Teller Dashboard</h2>
      <div className="board-grid">
        <div className="board-card board-card--teller" onClick={() => navigate('/customer-management')}>
          <div className="card-icon">👥</div>
          <h3>Customer Records</h3>
          <p>View and manage customer profiles</p>
        </div>
        <div className="board-card board-card--teller-alt" onClick={() => navigate('/kyc-submit')}>
          <div className="card-icon">📋</div>
          <h3>Submit KYC</h3>
          <p>Submit KYC documents for verification</p>
        </div>
        <div className="board-card board-card--teller" onClick={() => navigate('/create-account')}>
          <div className="card-icon">💳</div>
          <h3>Open Account</h3>
          <p>Customer details + account opening in one step</p>
        </div>
        <div className="board-card board-card--teller-alt" onClick={() => navigate('/deposit')}>
          <div className="card-icon">💰</div>
          <h3>Deposit Funds</h3>
          <p>Process customer deposits</p>
        </div>
        <div className="board-card board-card--teller" onClick={() => navigate('/withdraw')}>
          <div className="card-icon">💳</div>
          <h3>Withdraw Funds</h3>
          <p>Process customer withdrawals</p>
        </div>
        <div className="board-card board-card--teller-alt" onClick={() => navigate('/transfer')}>
          <div className="card-icon">🔄</div>
          <h3>Transfer Funds</h3>
          <p>Transfer between accounts</p>
        </div>
      </div>
    </div>
  );
};

const ManagerBoard = ({ navigate }) => {
  return (
    <div className="board">
      <h2>Manager Dashboard</h2>
      <div className="board-grid">
        <div className="board-card board-card--manager" onClick={() => navigate('/pending-approvals')}>
          <div className="card-icon">✅</div>
          <h3>Pending Approvals</h3>
          <p>Review and approve pending transactions</p>
        </div>
        <div className="board-card board-card--manager-alt" onClick={() => navigate('/kyc-verify')}>
          <div className="card-icon">🔍</div>
          <h3>Verify KYC</h3>
          <p>Review and approve KYC documents</p>
        </div>
        <div className="board-card board-card--manager" onClick={() => navigate('/customer-management')}>
          <div className="card-icon">👥</div>
          <h3>Manage Customers</h3>
          <p>Block/unblock customers, view profiles</p>
        </div>
        <div className="board-card board-card--manager-alt" onClick={() => navigate('/reports')}>
          <div className="card-icon">📊</div>
          <h3>Reports</h3>
          <p>View transaction and KYC reports</p>
        </div>
      </div>
    </div>
  );
};

const AdminBoard = ({ navigate }) => {
  return (
    <div className="board">
      <h2>Admin Dashboard</h2>
      <div className="board-grid">
        <div className="board-card board-card--admin" onClick={() => navigate('/employees')}>
          <div className="card-icon">👨‍💼</div>
          <h3>Manage Employees</h3>
          <p>View and manage employee accounts</p>
        </div>
        <div className="board-card board-card--admin-alt" onClick={() => navigate('/pending-approvals')}>
          <div className="card-icon">✅</div>
          <h3>Pending Approvals</h3>
          <p>Review high-value teller transactions</p>
        </div>
        <div className="board-card board-card--admin" onClick={() => navigate('/audit-logs')}>
          <div className="card-icon">📝</div>
          <h3>Audit Logs</h3>
          <p>View system activity, actor, IP, and context</p>
        </div>
        <div className="board-card board-card--admin-alt" onClick={() => navigate('/reports')}>
          <div className="card-icon">📊</div>
          <h3>Reports</h3>
          <p>Branch performance, balances, and KYC statistics</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
