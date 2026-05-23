import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './CheckBalance.css';

const CheckBalance = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState(null);
  const [accountStatus, setAccountStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const { addNotification } = useNotification();

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await client.get('/bank/accounts');
        setAccounts(response.data.data || response.data || []);
      } catch (err) {
        addNotification('Failed to load accounts', 'error');
      }
    };

    loadAccounts();
  }, [addNotification]);

  const handleCheck = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await client.get(`/bank/balance/${Number(accountNumber)}`);
      setBalance(res.data.balance);
      setAccountStatus(res.data.status);
      setError('');
      addNotification('Balance loaded successfully', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Account not found');
      setBalance(null);
      setAccountStatus('');
      addNotification(err.response?.data?.message || 'Account not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="balance-container">
      <h2>Check Account Balance</h2>
      <form onSubmit={handleCheck} className="balance-form">
        <select
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          required
        >
          <option value="">-- Select account --</option>
          {accounts.map((account) => (
            <option key={account._id} value={account.accountNumber}>
              {account.accountNumber} - ₹{account.balance?.toLocaleString('en-IN') || 0}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Check Balance'}</button>
      </form>
      {balance !== null && (
        <div className="result-card">
          <p className="result">Balance: ₹ {balance?.toLocaleString('en-IN')}</p>
          <p><strong>Status:</strong> {accountStatus}</p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default CheckBalance;
