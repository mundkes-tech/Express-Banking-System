import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <h1>Welcome to Express Banking System</h1>
      <p>Your digital solution for seamless banking.</p>
      <div className="home-buttons">
        <Link to="/create-account" className="home-btn">Create Account</Link>
        <Link to="/dashboard" className="home-btn">Dashboard</Link>
      </div>
    </div>
  );
};

export default Home;
