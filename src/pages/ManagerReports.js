import React, { useEffect, useMemo, useState } from 'react';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';
import './ManagerReports.css';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const ManagerReports = () => {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dailySummary, setDailySummary] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [pendingKyc, setPendingKyc] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, pendingTxnRes, pendingKycRes, customersRes, accountsRes] = await Promise.all([
          client.get('/reports/daily-summary'),
          client.get('/bank/transactions/pending'),
          client.get('/customers/kyc/pending'),
          client.get('/customers'),
          client.get('/bank/accounts'),
        ]);

        setDailySummary(summaryRes.data || null);
        setPendingTransactions(pendingTxnRes.data || []);
        setPendingKyc(pendingKycRes.data || []);
        setCustomers(customersRes.data.data || []);
        setAccounts(accountsRes.data.data || []);
        setError('');
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load manager reports';
        setError(message);
        addNotification(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addNotification]);

  const summaryCards = useMemo(() => ([
    { label: 'Customers', value: customers.length },
    { label: 'Accounts', value: accounts.length },
    { label: 'Total Balance', value: money(dailySummary?.totalBalance) },
    { label: 'Today Txns', value: dailySummary?.summary?.count || 0 },
    { label: 'Pending Txns', value: pendingTransactions.length },
    { label: 'Pending KYC', value: pendingKyc.length },
  ]), [accounts.length, customers.length, dailySummary, pendingKyc.length, pendingTransactions.length]);

  if (loading) {
    return <div className="manager-reports"><p>Loading manager reports...</p></div>;
  }

  return (
    <div className="manager-reports">
      <div className="reports-header">
        <div>
          <h2>Manager Reports</h2>
          <p>Operational overview for approvals, KYC, customer growth, and liquidity.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="summary-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className="summary-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="reports-panels">
        <section className="report-panel">
          <div className="panel-header">
            <h3>Pending Transaction Approvals</h3>
            <span>{pendingTransactions.length}</span>
          </div>
          {pendingTransactions.length === 0 ? (
            <p className="empty-state">No pending transaction approvals.</p>
          ) : (
            <ul className="compact-list">
              {pendingTransactions.slice(0, 5).map((txn) => (
                <li key={txn._id}>
                  <div>
                    <strong>{txn.type?.toUpperCase()}</strong>
                    <span>{txn.transactionId}</span>
                  </div>
                  <div>{money(txn.amount)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="report-panel">
          <div className="panel-header">
            <h3>Pending KYC Reviews</h3>
            <span>{pendingKyc.length}</span>
          </div>
          {pendingKyc.length === 0 ? (
            <p className="empty-state">No KYC items waiting for review.</p>
          ) : (
            <ul className="compact-list">
              {pendingKyc.slice(0, 5).map((cust) => (
                <li key={cust._id}>
                  <div>
                    <strong>{cust.name}</strong>
                    <span>{cust.customerId}</span>
                  </div>
                  <div>{cust.kyc?.idType || 'N/A'}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="report-panel wide">
          <div className="panel-header">
            <h3>Today’s Transaction Mix</h3>
            <span>{money(dailySummary?.summary?.totalAmount)}</span>
          </div>
          <div className="type-mix">
            {Object.entries(dailySummary?.summary?.byType || {}).length === 0 ? (
              <p className="empty-state">No successful transactions today.</p>
            ) : (
              Object.entries(dailySummary.summary.byType).map(([type, amount]) => (
                <div key={type} className="mix-chip">
                  <span>{type}</span>
                  <strong>{money(amount)}</strong>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="reports-footer-note">
        Manager responsibilities should focus on approvals, KYC, risk oversight, and branch performance. Account opening remains teller-led.
      </div>
    </div>
  );
};

export default ManagerReports;