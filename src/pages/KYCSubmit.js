import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { useLocation } from 'react-router-dom';
import './KYCVerify.css';

const KYCSubmit = () => {
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(location.state?.customerId || '');
  const [formData, setFormData] = useState({
    idType: 'aadhar',
    idNumber: '',
    idDocument: '',
  });
  const { addNotification } = useNotification();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await client.get('/customers');
        setCustomers(res.data.data || []);
      } catch (error) {
        addNotification('Failed to load customers', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [addNotification]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    // sanitize idNumber based on idType where possible
    if (name === 'idNumber') {
      if (formData.idType === 'aadhar') {
        const digits = value.replace(/\D/g, '').slice(0, 12);
        setFormData((prev) => ({ ...prev, idNumber: digits }));
        return;
      }

      if (formData.idType === 'pan') {
        const up = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        setFormData((prev) => ({ ...prev, idNumber: up }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCustomer || !formData.idType || !formData.idNumber) {
      addNotification('Select a customer and complete the KYC fields', 'warning');
      return;
    }

    // client-side id validation
    if (formData.idType === 'aadhar' && !/^\d{12}$/.test(formData.idNumber)) {
      addNotification('Aadhaar must be 12 digits', 'warning');
      return;
    }

    if (formData.idType === 'pan' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.idNumber)) {
      addNotification('PAN must be in format: AAAAA9999A', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await client.post(`/customers/${selectedCustomer}/kyc/start`, formData);
      addNotification('KYC submitted successfully', 'success');
      setFormData({ idType: 'aadhar', idNumber: '', idDocument: '' });
      setSelectedCustomer('');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit KYC';
      addNotification(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container"><p>Loading customers...</p></div>;
  }

  return (
    <div className="container">
      <h2>Submit KYC</h2>
      <div className="cm-form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="customer">Select Customer *</label>
            <select
              id="customer"
              value={selectedCustomer}
              onChange={(event) => setSelectedCustomer(event.target.value)}
              required
            >
              <option value="">-- Select customer --</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.customerId}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="idType">ID Type *</label>
            <select
              id="idType"
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              required
            >
              <option value="aadhar">Aadhaar</option>
              <option value="pan">PAN</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="idNumber">ID Number *</label>
            <input
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="Enter ID number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="idDocument">ID Document URL / Reference</label>
            <input
              id="idDocument"
              name="idDocument"
              value={formData.idDocument}
              onChange={handleChange}
              placeholder="Document URL or file reference"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit KYC'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KYCSubmit;
