import React, { useEffect, useState } from 'react';
import client from '../api/client';
import './ManagerReports.css';

const ManagerReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await client.get('/reports/daily-summary');
        setReport(res.data || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <div className="container"><p>Loading...</p></div>;

  if (error) return <div className="container"><p className="error">{error}</p></div>;

  const summary = report?.summary || { count: 0, totalAmount: 0, byType: {} };
  const byTypeEntries = Object.entries(summary.byType || {});

  return (
    <div className="container">
      <h2>Manager Reports</h2>
      {report ? (
        <>
          <div className="reports-grid">
            <div className="card">
              <h3>Transactions Today</h3>
              <p>{summary.count}</p>
            </div>
            <div className="card">
              <h3>Total Amount Today</h3>
              <p>₹{Number(summary.totalAmount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="card">
              <h3>Total Accounts</h3>
              <p>{report.totalAccounts ?? 0}</p>
            </div>
            <div className="card">
              <h3>Total Balance</h3>
              <p>₹{Number(report.totalBalance || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="report-section">
            <h3>Amount by Transaction Type</h3>
            {byTypeEntries.length === 0 ? (
              <p>No transactions found for today.</p>
            ) : (
              <div className="by-type-list">
                {byTypeEntries.map(([type, amount]) => (
                  <div className="by-type-row" key={type}>
                    <span>{type}</span>
                    <strong>₹{Number(amount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="report-meta">Report date: {new Date(report.date).toLocaleDateString()}</p>
        </>
      ) : (
        <p>No report data available.</p>
      )}
    </div>
  );
};

export default ManagerReports;
