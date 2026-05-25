import React, { useEffect, useMemo, useState, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './TransferFunds.css';
import Modal from '../components/Modal';

const TransferFunds = () => {
  const { employee } = useAuth();
  const { addNotification } = useNotification();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/bank/accounts');
      setAccounts(res.data.data || res.data || []);
    } catch (error) {
      addNotification('Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const tellerLimit = useMemo(() => {
    if (employee?.role === 'manager') return 500000;
    if (employee?.role === 'admin') return Number.MAX_SAFE_INTEGER;
    return 50000;
  }, [employee?.role]);

  

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const parsedAmount = Number(amount);
      if (!from || !to || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        addNotification('Select both accounts and enter a valid amount', 'warning');
        return;
      }

      if (from === to) {
        addNotification('From and To accounts must be different', 'warning');
        return;
      }

      if (!/^[0-9]{6,20}$/.test(String(from)) || !/^[0-9]{6,20}$/.test(String(to))) {
        addNotification('Invalid account number format', 'warning');
        return;
      }

      const payload = { fromAccountNumber: Number(from), toAccountNumber: Number(to), amount: parsedAmount, description: description || 'Internal transfer' };
      if (parsedAmount > tellerLimit) {
        setPendingPayload(payload);
        setConfirmOpen(true);
        return;
      }

      setSubmitting(true);
      const res = await client.post('/bank/transfer', payload);

      const transaction = res.data.transaction || res.data.data || null;
      setMessage(res.data.message || 'Transfer submitted');
      addNotification(transaction?.status === 'pending' ? 'Transfer submitted for approval' : 'Transfer completed successfully', 'success');

      if (transaction?.transactionId) {
        const id = addNotification(
          <span>
            Transfer {transaction.transactionId} recorded. <button onClick={async () => {
              try {
                await client.post(`/bank/transactions/${transaction.transactionId}/cancel`);
                addNotification('Undo successful', 'success');
              } catch (err) {
                addNotification(err.response?.data?.message || 'Undo failed', 'error');
              }
            }} style={{marginLeft:8}}>Undo</button>
          </span>,
          'info',
          10000
        );
      }

      setFrom('');
      setTo('');
      setAmount('');
      setDescription('');
      await fetchAccounts();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Transfer failed';
      setMessage(errorMessage);
      addNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmProceed = async () => {
    if (!pendingPayload) return;
    setConfirmOpen(false);
    try {
      setSubmitting(true);
      const res = await client.post('/bank/transfer', pendingPayload);
      const transaction = res.data.transaction || res.data.data || null;
      setMessage(res.data.message || 'Transfer submitted');
      addNotification(transaction?.status === 'pending' ? 'Transfer submitted for approval' : 'Transfer completed successfully', 'success');

      if (transaction?.transactionId) {
        addNotification(
          <span>
            Transfer {transaction.transactionId} recorded. <button onClick={async () => {
              try {
                await client.post(`/bank/transactions/${transaction.transactionId}/cancel`);
                addNotification('Undo successful', 'success');
              } catch (err) {
                addNotification(err.response?.data?.message || 'Undo failed', 'error');
              }
            }} style={{marginLeft:8}}>Undo</button>
          </span>,
          'info',
          10000
        );
      }

      setFrom('');
      setTo('');
      setAmount('');
      setDescription('');
      await fetchAccounts();
    } catch (err) {
      addNotification(err.response?.data?.message || 'Transfer failed', 'error');
    } finally {
      setSubmitting(false);
      setPendingPayload(null);
    }
  };

  return (
    <div className="transfer-container">
      <h2>Internal Transfer</h2>
      <p className="transfer-note">Role limit: ₹{tellerLimit.toLocaleString('en-IN')}</p>

      {loading ? (
        <p>Loading accounts...</p>
      ) : (
        <>
        <form onSubmit={handleTransfer} className="transfer-form">
          <label>
            From Account
            <select value={from} onChange={(e) => setFrom(e.target.value)} required>
              <option value="">-- Select source account --</option>
              {accounts.map((account) => (
                <option key={account._id} value={account.accountNumber}>
                  {account.accountNumber} - ₹{account.balance?.toLocaleString('en-IN') || 0}
                </option>
              ))}
            </select>
          </label>

          <label>
            To Account
            <select value={to} onChange={(e) => setTo(e.target.value)} required>
              <option value="">-- Select destination account --</option>
              {accounts.map((account) => (
                <option key={account._id} value={account.accountNumber}>
                  {account.accountNumber} - ₹{account.balance?.toLocaleString('en-IN') || 0}
                </option>
              ))}
            </select>
          </label>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="0.01"
            required
          />

          <textarea
            placeholder="Description / purpose"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Transferring...' : 'Transfer'}
          </button>
        </form>
        <Modal open={confirmOpen} title="Confirm Large Transfer" onClose={() => setConfirmOpen(false)}>
          <p>You are attempting to transfer ₹{pendingPayload?.amount?.toLocaleString('en-IN')} which exceeds your approval limit of ₹{tellerLimit.toLocaleString('en-IN')}.</p>
          <div style={{display:'flex', justifyContent:'flex-end', gap: '8px', marginTop: '12px'}}>
            <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={confirmProceed} disabled={submitting}>{submitting ? 'Processing...' : 'Proceed'}</button>
          </div>
        </Modal>
        </>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default TransferFunds;
