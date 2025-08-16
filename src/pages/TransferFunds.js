import React, { useState } from 'react';
import axios from 'axios';
import './TransferFunds.css';

const TransferFunds = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/bank/transfer', {
        fromAccount: parseInt(from),
        toAccount: parseInt(to),
        amount: parseFloat(amount)
      });
      setMessage(`✅ ${res.data.message}`);
      setFrom('');
      setTo('');
      setAmount('');
    } catch (err) {
      console.error(err);
      setMessage('❌ Transfer failed');
    }
  };

  return (
    <div className="transfer-container">
      <h2>Transfer Funds</h2>
      <form onSubmit={handleTransfer} className="transfer-form">
        <input
          type="number"
          placeholder="From Account"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="To Account"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit">Transfer</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default TransferFunds;
