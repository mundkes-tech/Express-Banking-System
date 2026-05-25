import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { quickLogin } = useAuth();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({ employeeId: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      addNotification(apiMessage || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Bank Employee Login</h2>
      <p className="auth-subtitle">Fintech Banking System</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          name="employeeId"
          placeholder="Employee ID (e.g., ADMIN001, TELLER001)"
          value={formData.employeeId}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      
      <p className="auth-note">Default Admin: ADMIN001 / Admin@123</p>
      <div className="quick-login">
        <p className="auth-note">Quick login (dev only):</p>
        <div className="quick-buttons">
          <button type="button" onClick={async () => { setLoading(true); try { await quickLogin('admin'); navigate('/dashboard'); } catch (e) { addNotification(e.response?.data?.message || 'Quick login failed', 'error'); } finally { setLoading(false); } }} disabled={loading}>Admin</button>
          <button type="button" onClick={async () => { setLoading(true); try { await quickLogin('manager'); navigate('/dashboard'); } catch (e) { addNotification(e.response?.data?.message || 'Quick login failed', 'error'); } finally { setLoading(false); } }} disabled={loading}>Manager</button>
          <button type="button" onClick={async () => { setLoading(true); try { await quickLogin('teller'); navigate('/dashboard'); } catch (e) { addNotification(e.response?.data?.message || 'Quick login failed', 'error'); } finally { setLoading(false); } }} disabled={loading}>Teller</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
