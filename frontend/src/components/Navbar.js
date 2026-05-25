import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout, employee } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-brand">🏦 Bank Employee System</div>
        <button
          type="button"
          className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <div className={`navbar-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="navbar-backdrop" onClick={closeMenu} />
        <ul className="navbar-links">
        <li><Link to="/" onClick={closeMenu}>Home</Link></li>
        {isAuthenticated ? (
          <>
            <li><Link to="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
            {(employee?.role === 'manager' || employee?.role === 'admin') && (
              <li><Link to="/pending-approvals" onClick={closeMenu}>Approvals</Link></li>
            )}
            {(employee?.role === 'manager' || employee?.role === 'admin') && (
              <li><Link to="/kyc-verify" onClick={closeMenu}>KYC Verify</Link></li>
            )}
            {(employee?.role === 'manager' || employee?.role === 'admin') && (
              <li><Link to="/reports" onClick={closeMenu}>Reports</Link></li>
            )}
            {employee?.role === 'admin' && (
              <li><Link to="/audit-logs" onClick={closeMenu}>Audit Logs</Link></li>
            )}
            {employee?.role === 'admin' && (
              <li><Link to="/employees" onClick={closeMenu}>Employees</Link></li>
            )}
            <li className="employee-info">
              <span>👤 {employee?.name || 'Employee'} ({employee?.role})</span>
            </li>
            <li><button type="button" className="logout-btn" onClick={() => { logout(); closeMenu(); }}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login" onClick={closeMenu}>Employee Login</Link></li>
          </>
        )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
