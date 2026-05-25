import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, employee } = useAuth();

  return (
    <div className="home-container">
      <h1>Welcome to Express Banking System</h1>
      <p>Your digital solution for seamless banking.</p>
      <div className="home-buttons">
        {isAuthenticated ? (
          <>
            {(employee?.role === 'teller' || employee?.role === 'admin') && (
              <Link to="/create-account" className="home-btn">Open Account</Link>
            )}
            {(employee?.role === 'manager' || employee?.role === 'admin') && (
              <Link to="/reports" className="home-btn">Reports</Link>
            )}
            <Link to="/dashboard" className="home-btn">Dashboard</Link>
          </>
        ) : (
          <>
            <Link to="/login" className="home-btn">Employee Login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
