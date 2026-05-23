import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './PendingApprovals.css';

const PendingApprovals = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await client.get('/bank/transactions/pending');
      setTransactions(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId) => {
    try {
      await client.post(`/bank/transactions/${transactionId}/approve`, {});
      setSelectedTxn(null);
      fetchPending();
      addNotification('Transaction approved successfully!', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      addNotification('Error approving transaction: ' + errorMsg, 'error');
    }
  };

  const handleReject = async (transactionId) => {
    try {
      await client.post(`/bank/transactions/${transactionId}/reject`, { rejectionReason: rejectReason || 'Rejected by approver' });
      setSelectedTxn(null);
      setRejectReason('');
      fetchPending();
      addNotification('Transaction rejected successfully!', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      addNotification('Error rejecting transaction: ' + errorMsg, 'error');
    }
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;

  return (
    <div className="container">
      <h2>Pending Transaction Approvals</h2>
      {error && <div className="error-box">{error}</div>}

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>No pending transactions for approval.</p>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((txn) => (
            <div key={txn._id} className="transaction-card">
              <div className="txn-header">
                <h3>{txn.type.toUpperCase()}</h3>
                <span className="amount">₹{txn.amount.toFixed(2)}</span>
              </div>
              <div className="txn-details">
                <p><strong>ID:</strong> {txn.transactionId}</p>
                <p><strong>Status:</strong> <span className="badge pending">{txn.status}</span></p>
                <p><strong>Requested By:</strong> {txn.requestedBy?.name || 'N/A'}</p>
                <p><strong>Date:</strong> {new Date(txn.createdAt).toLocaleString()}</p>
              </div>
              <div className="txn-actions">
                <button className="btn-approve" onClick={() => setSelectedTxn(txn)}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTxn && (
        <div className="modal-overlay" onClick={() => setSelectedTxn(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Transaction Details</h3>
            <div className="modal-content">
              <p><strong>Transaction ID:</strong> {selectedTxn.transactionId}</p>
              <p><strong>Type:</strong> {selectedTxn.type}</p>
              <p><strong>Amount:</strong> ₹{selectedTxn.amount}</p>
              <p><strong>Status:</strong> {selectedTxn.status}</p>
              <p><strong>Requested By:</strong> {selectedTxn.requestedBy?.name}</p>
              <p><strong>Date:</strong> {new Date(selectedTxn.createdAt).toLocaleString()}</p>
              <textarea
                placeholder="Enter rejection reason (if rejecting)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-approve" onClick={() => handleApprove(selectedTxn.transactionId)}>
                Approve
              </button>
              <button className="btn-reject" onClick={() => handleReject(selectedTxn.transactionId)}>
                Reject
              </button>
              <button className="btn-cancel" onClick={() => setSelectedTxn(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
