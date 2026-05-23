import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './CustomerManagement.css';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  const formatAddress = (address) => {
    if (!address || typeof address !== 'object') {
      return '';
    }

    return [address.street, address.city, address.state, address.postalCode, address.country]
      .filter(Boolean)
      .join(', ');
  };

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await client.get('/customers');
        setCustomers(response.data.data || []);
      } catch (error) {
        addNotification('Failed to load customers', 'error');
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [addNotification]);

  if (loading) {
    return <div className="customer-management"><p>Loading customers...</p></div>;
  }

  return (
    <div className="customer-management">
      <div className="cm-header">
        <h2>Customer Management</h2>
        <p className="cm-subtitle">Customers created via "Open Account". Use "KYC Submit" to verify customers.</p>
      </div>

      <div className="customers-list">
        <h3>{customers.length} Customer(s)</h3>
        {customers.length === 0 ? (
          <p className="no-data">No customers yet. Go to "Open Account" to create customers.</p>
        ) : (
          <div className="customers-grid">
            {customers.map((customer) => (
              <div key={customer._id} className="customer-card">
                <div className="card-header">
                  <h4>{customer.name}</h4>
                  <span className={`status-badge status-${customer.status}`}>
                    {customer.status}
                  </span>
                </div>
                <div className="card-body">
                  <p><strong>ID:</strong> {customer.customerId}</p>
                  <p><strong>Email:</strong> {customer.email}</p>
                  <p><strong>Phone:</strong> {customer.phone}</p>
                  {formatAddress(customer.address) && <p><strong>Address:</strong> {formatAddress(customer.address)}</p>}
                  <p><strong>KYC Status:</strong> <span className={`kyc-badge kyc-${customer.kyc?.status || 'not_started'}`}>
                    {customer.kyc?.status?.replace(/_/g, ' ') || 'not started'}
                  </span></p>
                  <p className="text-muted"><small>Created: {new Date(customer.createdAt).toLocaleDateString()}</small></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;
