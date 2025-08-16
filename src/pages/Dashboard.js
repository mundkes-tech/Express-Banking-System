import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/bank/accounts')
      .then(res => setAccounts(res.data))
      .catch(err => console.error(err));
  }, []);
  return (
    <div className="dashboard-container">
      <h2>All Bank Accounts</h2>
      {accounts.length === 0 ? (
        <p>No accounts found.</p>
      ) : (
        <table className="account-table">
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Name</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.accountNumber}>
                <td>{acc.accountNumber}</td>
                <td>{acc.name}</td>
                <td>₹ {acc.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default Dashboard;
