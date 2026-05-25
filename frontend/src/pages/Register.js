import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const Register = () => {
  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Employee Registration</h2>
        <div className="error-box">
          <p>
            <strong>Employee registration is not available.</strong>
          </p>
          <p>
            Employee accounts are created by Bank Administrators only. 
            If you are a new employee, please contact your administrator to request account creation.
          </p>
        </div>
        <p>
          Have an employee account? <Link to="/login">Sign in here</Link>
        </p>
        <p>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
