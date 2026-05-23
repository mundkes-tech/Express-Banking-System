import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './CheckBalance.css';

const TransactionHistory = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const handleFetch = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      setLoading(true);
      const response = await client.get(`/bank/transactions/${Number(accountNumber)}`);
      setTransactions(response.data.transactions || []);
      if ((response.data.transactions || []).length === 0) {
        setMessage('No transactions found for this account.');
      }
      addNotification('Transaction history loaded', 'success');
    } catch (error) {
      setTransactions([]);
      setMessage(error.response?.data?.message || 'Failed to fetch transactions');
      addNotification(error.response?.data?.message || 'Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!transactions || transactions.length === 0) {
      addNotification('No transactions to export', 'warning');
      return;
    }

    const headers = ['Transaction ID', 'Type', 'Amount', 'Description', 'Status', 'Date'];
    const rows = transactions.map((t) => [t.transactionId || '', t.type || '', t.amount || '', (t.description || '').replace(/\n/g, ' '), t.status || '', new Date(t.createdAt).toISOString()]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${accountNumber || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReceipt = (t) => {
    const win = window.open('', '_blank');
    const html = `
      <html>
      <head><title>Receipt ${t.transactionId}</title></head>
      <body>
        <h2>Transaction Receipt</h2>
        <p><strong>Transaction ID:</strong> ${t.transactionId || ''}</p>
        <p><strong>Type:</strong> ${t.type || ''}</p>
        <p><strong>Account:</strong> ${t.accountNumber || ''}</p>
        <p><strong>Amount:</strong> ₹ ${t.amount}</p>
        <p><strong>Description:</strong> ${t.description || ''}</p>
        <p><strong>Date:</strong> ${new Date(t.createdAt).toLocaleString()}</p>
        <hr />
        <p>Thank you.</p>
      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <div className="balance-container">
      <h2>Transaction History</h2>
      <form onSubmit={handleFetch} className="balance-form">
        <select
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          required
        >
          <option value="">-- Select account --</option>
          {accounts.map((account) => (
            <option key={account._id} value={account.accountNumber}>
              {account.accountNumber} - ₹{account.balance?.toLocaleString('en-IN') || 0}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Get History'}</button>
      </form>

      {message && <p className="error">{message}</p>}

      {transactions.length > 0 && (
        <>
        <div style={{display:'flex', justifyContent:'flex-end', gap: '8px'}}>
          <button className="btn-secondary" onClick={exportCSV}>Export CSV</button>
        </div>
        <table className="account-table" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr key={`${transaction.type}-${transaction.createdAt}-${index}`}>
                <td data-label="Type">{transaction.type}</td>
                <td data-label="Amount">₹ {transaction.amount}</td>
                <td data-label="Description">{transaction.description}</td>
                <td data-label="Date">{new Date(transaction.createdAt).toLocaleString()}</td>
                <td data-label="Action">
                  <button className="btn-secondary" onClick={() => printReceipt(transaction)}>Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default TransactionHistory;

