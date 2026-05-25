import React, { useState } from 'react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './CreateAccount.css';

const emptyAddress = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

const CreateAccount = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: emptyAddress,
    accountType: 'savings',
    initialBalance: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData((previous) => ({
        ...previous,
        address: {
          ...previous.address,
          [addressField]: value,
        },
      }));
      return;
    }

    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((previous) => ({ ...previous, phone: digits }));
      return;
    }

    if (name === 'initialBalance') {
      const sanitized = value.replace(/[^0-9.]/g, '');
      setFormData((previous) => ({ ...previous, initialBalance: sanitized }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await client.post('/bank/open-account', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        accountType: formData.accountType,
        initialBalance: Number(formData.initialBalance || 0),
      });

      setResult({
        customerId: response.data.customer.customerId,
        accountNumber: response.data.account.accountNumber,
        customerName: response.data.customer.name,
        customerObjectId: response.data.customer._id,
      });
      addNotification('Account opened successfully', 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: emptyAddress,
        accountType: 'savings',
        initialBalance: '',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to open account';
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Open New Customer Account</h2>
      <p className="form-subtitle">Fill personal details and account details in one step.</p>

      <form onSubmit={handleSubmit} className="account-form">
        <div className="section-card">
          <h3>Personal Details</h3>
          <input type="text" name="name" placeholder="Customer Name" value={formData.name} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="tel" name="phone" placeholder="10-digit Phone" value={formData.phone} onChange={handleChange} required />
          <input type="text" name="address.street" placeholder="Street" value={formData.address.street} onChange={handleChange} />
          <div className="two-col-grid">
            <input type="text" name="address.city" placeholder="City" value={formData.address.city} onChange={handleChange} />
            <input type="text" name="address.state" placeholder="State" value={formData.address.state} onChange={handleChange} />
          </div>
          <div className="two-col-grid">
            <input type="text" name="address.postalCode" placeholder="Postal Code" value={formData.address.postalCode} onChange={handleChange} />
            <input type="text" name="address.country" placeholder="Country" value={formData.address.country} onChange={handleChange} />
          </div>
        </div>

        <div className="section-card">
          <h3>Account Details</h3>
          <select name="accountType" value={formData.accountType} onChange={handleChange}>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
            <option value="fixed_deposit">Fixed Deposit</option>
          </select>
          <input
            type="number"
            name="initialBalance"
            placeholder="Initial Deposit"
            value={formData.initialBalance}
            onChange={handleChange}
            min="0"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Opening Account...' : 'Open Account'}
        </button>
      </form>

      {result && (
        <div className="success-box">
          <p><strong>Customer:</strong> {result.customerName}</p>
          <p><strong>Customer ID:</strong> {result.customerId}</p>
          <p><strong>Account Number:</strong> {result.accountNumber}</p>
          <button
            type="button"
            className="success-action"
            onClick={() => navigate('/kyc-submit', { state: { customerId: result.customerObjectId } })}
          >
            Submit KYC for this customer
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateAccount;
