import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './KYCVerify.css';

const KYCVerify = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    try {
      setLoading(true);
      const res = await client.get('/customers/kyc/pending');
      setCustomers(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (customerId) => {
    try {
      await client.post(`/customers/${customerId}/kyc/verify`, { approved: true });
      setSelectedCust(null);
      fetchPendingKYC();
      addNotification('KYC approved successfully!', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      addNotification('Error approving KYC: ' + errorMsg, 'error');
    }
  };

  const handleReject = async (customerId) => {
    try {
      await client.post(`/customers/${customerId}/kyc/verify`, {
        approved: false,
        rejectionReason: rejectionReason || 'KYC rejected by verifier',
      });
      setSelectedCust(null);
      setRejectionReason('');
      fetchPendingKYC();
      addNotification('KYC rejected successfully!', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      addNotification('Error rejecting KYC: ' + errorMsg, 'error');
    }
  };

  const renderDocumentPreview = (docRef) => {
    if (!docRef) return null;
    const lower = String(docRef).toLowerCase();
    // if looks like URL or blob, render preview
    if (lower.startsWith('http') || lower.startsWith('blob:')) {
      if (lower.endsWith('.pdf')) {
        return (
          <div className="doc-preview">
            <iframe src={docRef} title="doc-preview" />
          </div>
        );
      }
      return (
        <div className="doc-preview">
          <img src={docRef} alt="doc-preview" />
        </div>
      );
    }

    // if it contains pdf extension, still attempt show as iframe if remote
    if (lower.includes('.pdf')) {
      return (
        <div className="doc-preview">
          <iframe src={docRef} title="doc-preview" />
        </div>
      );
    }

    // fallback: show as text reference
    return <div className="doc-preview"><p>{docRef}</p></div>;
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h2>KYC Verification</h2>
      {error && <div className="error-box">{error}</div>}

      {customers.length === 0 ? (
        <div className="empty-state">
          <p>No pending KYC verifications.</p>
        </div>
      ) : (
        <div className="kyc-list">
          {customers.map((cust) => (
            <div key={cust._id} className="kyc-card">
              <div className="kyc-header">
                <div>
                  <h3>{cust.name}</h3>
                  <p className="customer-id">{cust.customerId}</p>
                </div>
                <span className="badge pending">Pending Review</span>
              </div>
              <div className="kyc-details">
                <p><strong>Email:</strong> {cust.email}</p>
                <p><strong>Phone:</strong> {cust.phone}</p>
                <p><strong>ID Type:</strong> {cust.kyc?.idType || 'N/A'}</p>
                <p><strong>ID Number:</strong> {cust.kyc?.idNumber || 'N/A'}</p>
                <p><strong>Submitted:</strong> {new Date(cust.createdAt).toLocaleString()}</p>
              </div>
              <div className="kyc-actions">
                <button className="btn-approve" onClick={() => setSelectedCust(cust)}>
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCust && (
        <div className="modal-overlay" onClick={() => setSelectedCust(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>KYC Review - {selectedCust.name}</h3>
            <div className="modal-content">
              <p><strong>Customer ID:</strong> {selectedCust.customerId}</p>
              <p><strong>Email:</strong> {selectedCust.email}</p>
              <p><strong>Phone:</strong> {selectedCust.phone}</p>
              <p><strong>Address:</strong> {selectedCust.address?.street}, {selectedCust.address?.city}</p>
              <p><strong>ID Type:</strong> {selectedCust.kyc?.idType}</p>
              <p><strong>ID Number:</strong> {selectedCust.kyc?.idNumber}</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p><strong>ID Document:</strong></p>
                  {renderDocumentPreview(selectedCust.kyc?.idDocument)}
                </div>
                <div style={{ width: 320 }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Rejection reason</label>
                  <textarea
                    placeholder="Enter rejection reason (if rejecting)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-approve" onClick={() => handleApprove(selectedCust._id)}>
                Approve
              </button>
              <button className="btn-reject" onClick={() => handleReject(selectedCust._id)}>
                Reject
              </button>
              <button className="btn-cancel" onClick={() => setSelectedCust(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerify;
