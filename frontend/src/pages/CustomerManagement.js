import React, { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './CustomerManagement.css';

const emptyAddress = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState('');
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: emptyAddress });
  const [savingCustomerId, setSavingCustomerId] = useState('');
  const { addNotification } = useNotification();

  const formatAddress = (address) => {
    if (!address || typeof address !== 'object') {
      return '';
    }

    return [address.street, address.city, address.state, address.postalCode, address.country]
      .filter(Boolean)
      .join(', ');
  };

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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const searchable = [
        customer.name,
        customer.email,
        customer.phone,
        customer.customerId,
        customer.status,
        customer.kyc?.status,
        formatAddress(customer.address),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [customers, searchTerm]);

  const beginEdit = (customer) => {
    setEditingCustomerId(customer._id);
    setEditForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        postalCode: customer.address?.postalCode || '',
        country: customer.address?.country || '',
      },
    });
  };

  const cancelEdit = () => {
    setEditingCustomerId('');
    setEditForm({ name: '', email: '', phone: '', address: emptyAddress });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setEditForm((previous) => ({
        ...previous,
        address: {
          ...previous.address,
          [field]: value,
        },
      }));
      return;
    }

    if (name === 'phone') {
      setEditForm((previous) => ({ ...previous, phone: value.replace(/\D/g, '').slice(0, 10) }));
      return;
    }

    setEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSave = async (customerId) => {
    try {
      setSavingCustomerId(customerId);
      await client.put(`/customers/${customerId}`, editForm);
      addNotification('Customer updated successfully', 'success');
      cancelEdit();
      await fetchCustomers();
    } catch (error) {
      addNotification(error.response?.data?.message || 'Failed to update customer', 'error');
    } finally {
      setSavingCustomerId('');
    }
  };

  const toggleBlock = async (customer) => {
    try {
      setSavingCustomerId(customer._id);
      await client.post(`/customers/${customer._id}/block`, {
        blocked: customer.status !== 'blocked',
      });
      addNotification(`Customer ${customer.status === 'blocked' ? 'unblocked' : 'blocked'} successfully`, 'success');
      await fetchCustomers();
    } catch (error) {
      addNotification(error.response?.data?.message || 'Failed to update customer status', 'error');
    } finally {
      setSavingCustomerId('');
    }
  };

  if (loading) {
    return <div className="customer-management"><p>Loading customers...</p></div>;
  }

  return (
    <div className="customer-management">
      <div className="cm-header">
        <h2>Customer Management</h2>
        <p className="cm-subtitle">Manage customer records, KYC state, and account status.</p>
      </div>

      <div className="cm-toolbar">
        <input
          className="cm-search"
          type="search"
          placeholder="Search by name, customer ID, email, phone, status..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button type="button" className="cm-refresh" onClick={fetchCustomers}>Refresh</button>
      </div>

      <div className="customers-list">
        <h3>{filteredCustomers.length} Customer(s)</h3>
        {filteredCustomers.length === 0 ? (
          <p className="no-data">No customers found for the current search.</p>
        ) : (
          <div className="customers-grid">
            {filteredCustomers.map((customer) => {
              const isEditing = editingCustomerId === customer._id;
              return (
                <div key={customer._id} className="customer-card">
                  <div className="card-header">
                    <h4>{customer.name}</h4>
                    <span className={`status-badge status-${customer.status}`}>
                      {customer.status}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="customer-edit-form">
                      <input name="name" value={editForm.name} onChange={handleEditChange} placeholder="Name" />
                      <input name="email" type="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" />
                      <input name="phone" value={editForm.phone} onChange={handleEditChange} placeholder="Phone" />
                      <input name="address.street" value={editForm.address.street} onChange={handleEditChange} placeholder="Street" />
                      <div className="two-col-grid">
                        <input name="address.city" value={editForm.address.city} onChange={handleEditChange} placeholder="City" />
                        <input name="address.state" value={editForm.address.state} onChange={handleEditChange} placeholder="State" />
                      </div>
                      <div className="two-col-grid">
                        <input name="address.postalCode" value={editForm.address.postalCode} onChange={handleEditChange} placeholder="Postal Code" />
                        <input name="address.country" value={editForm.address.country} onChange={handleEditChange} placeholder="Country" />
                      </div>
                    </div>
                  ) : null}

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

                  <div className="customer-actions">
                    {isEditing ? (
                      <>
                        <button type="button" className="action-btn primary" disabled={savingCustomerId === customer._id} onClick={() => handleSave(customer._id)}>
                          {savingCustomerId === customer._id ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="action-btn secondary" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" className="action-btn primary" onClick={() => beginEdit(customer)}>Edit</button>
                    )}

                    <button type="button" className="action-btn secondary" disabled={savingCustomerId === customer._id} onClick={() => toggleBlock(customer)}>
                      {customer.status === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;
