import React, { useState } from 'react';
import axios from 'axios';
import './CheckBalance.css';

const CheckBalance = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`http://localhost:5000/api/bank/balance/${accountNumber}`);
      setBalance(res.data.balance);
      setError('');
    } catch (err) {
      console.error(err);
      setError('❌ Account not found');
      setBalance(null);
    }
  };

  return (
    <div className="balance-container">
      <h2>Check Account Balance</h2>
      <form onSubmit={handleCheck} className="balance-form">
        <input
          type="number"
          placeholder="Enter Account Number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          required
        />
        <button type="submit">Check Balance</button>
      </form>
      {balance !== null && <p className="result">Balance: ₹ {balance}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default CheckBalance;
