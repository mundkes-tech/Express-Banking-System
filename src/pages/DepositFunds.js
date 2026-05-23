import React, { useMemo, useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Transaction.css';
import Modal from '../components/Modal';

const DepositFunds = () => {
  const { employee } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState(null);
  const { addNotification } = useNotification();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const tellerLimit = useMemo(() => {
    if (employee?.role === 'manager') return 500000;
    if (employee?.role === 'admin') return Number.MAX_SAFE_INTEGER;
    return 50000;
  }, [employee?.role]);

  // Fetch customer accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const res = await client.get('/bank/accounts');
        setAccounts(res.data.data || []);
      } catch (error) {
        addNotification('Failed to load accounts', 'error');
        console.error('Error fetching accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [addNotification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAccount || !amount) {
      addNotification('Please select an account and enter an amount', 'warning');
      return;
    }

    // account numbers are numeric (6-20 digits)
    if (!/^[0-9]{6,20}$/.test(String(selectedAccount))) {
      addNotification('Invalid account selected', 'warning');
      return;
    }

    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      addNotification('Amount must be a positive number', 'warning');
      return;
    }

    const payload = { accountNumber: Number(selectedAccount), amount: numAmount, description: description || 'Deposit transaction' };

    // if amount meets or exceeds teller limit, show confirmation modal before proceeding
    if (numAmount >= tellerLimit) {
      setPendingPayload(payload);
      setConfirmOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      const res = await client.post('/bank/deposit', payload);

      const transaction = res.data.transaction || res.data.data;
      setResponse(transaction);
      addNotification(
        transaction?.status === 'pending' ? 'Deposit submitted for approval' : 'Deposit completed successfully',
        'success'
      );

      // Reset form
      setSelectedAccount('');
      setAmount('');
      setDescription('');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to process deposit';
      addNotification(errorMsg, 'error');
      console.error('Error processing deposit:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmProceed = async () => {
    if (!pendingPayload) return;
    setConfirmOpen(false);
    try {
      setSubmitting(true);
      const res = await client.post('/bank/deposit', pendingPayload);
      const transaction = res.data.transaction || res.data.data;
      setResponse(transaction);
      addNotification(transaction?.status === 'pending' ? 'Deposit submitted for approval' : 'Deposit completed successfully', 'success');
      if (transaction?.transactionId) {
        addNotification(
          <span>
            Deposit {transaction.transactionId} recorded. <button onClick={async () => {
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
      setSelectedAccount('');
      setAmount('');
      setDescription('');
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to process deposit', 'error');
    } finally {
      setSubmitting(false);
      setPendingPayload(null);
    }
  };

  const handleNewTransaction = () => {
    setResponse(null);
  };

  if (loading) {
    return <div className="transaction-page"><p>Loading accounts...</p></div>;
  }

  if (response) {
    return (
      <div className="transaction-page">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Deposit Transaction Initiated</h2>
          <div className="transaction-details">
            <p><strong>Transaction ID:</strong> {response.transactionId}</p>
            <p><strong>Account:</strong> {response.accountNumber}</p>
            <p><strong>Amount:</strong> ₹{response.amount?.toLocaleString('en-IN') || 0}</p>
            <p><strong>Status:</strong> <span className={`status-badge status-${response.status}`}>{response.status}</span></p>
            <p><strong>Description:</strong> {response.description || 'N/A'}</p>
            {response.status === 'pending' && (
              <p className="info-text">This transaction is pending approval from a manager.</p>
            )}
          </div>
          <button onClick={handleNewTransaction} className="btn-primary">
            Make Another Deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-page">
      <div className="transaction-container">
        <h2>Deposit Funds</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="account">Select Account *</label>
            <select
              id="account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              required
            >
              <option value="">-- Select an account --</option>
              {accounts.map((account) => (
                <option key={account._id} value={account.accountNumber}>
                  {account.accountNumber} - ₹{account.balance?.toLocaleString('en-IN') || 0}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && (
            <div className="account-info">
              {accounts.find(a => a.accountNumber === selectedAccount) && (
                <>
                  <p><strong>Current Balance:</strong> ₹{accounts.find(a => a.accountNumber === selectedAccount).balance?.toLocaleString('en-IN') || 0}</p>
                  <p><strong>Account Type:</strong> {accounts.find(a => a.accountNumber === selectedAccount).accountType}</p>
                </>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">Amount (₹) *</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
              min="1"
              required
            />
          </div>

          <div className="account-info">
            <p><strong>Role limit:</strong> ₹{tellerLimit.toLocaleString('en-IN')}</p>
            <p className="info-text">Amounts at or above your limit will be sent for manager approval.</p>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter transaction description (optional)"
              rows="3"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Processing...' : 'Deposit Funds'}
          </button>
        </form>
        <Modal open={confirmOpen} title="Confirm Large Deposit" onClose={() => setConfirmOpen(false)}>
          <p>You are attempting to deposit ₹{pendingPayload?.amount?.toLocaleString('en-IN')} which meets or exceeds your approval limit of ₹{tellerLimit.toLocaleString('en-IN')}.</p>
          <div style={{display:'flex', justifyContent:'flex-end', gap: '8px', marginTop: '12px'}}>
            <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={confirmProceed} disabled={submitting}>{submitting ? 'Processing...' : 'Proceed'}</button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DepositFunds;
