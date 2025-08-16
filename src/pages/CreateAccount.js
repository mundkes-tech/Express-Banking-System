import React, { useState } from 'react';
import axios from 'axios';
import './CreateAccount.css';

const CreateAccount = () => {
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/bank/create', {
        name,
        balance: parseFloat(initialBalance),
      });
      if (res.status === 201) {
        setMessage(`✅ Account created! Account Number: ${res.data.accountNumber}`);
        setName('');
        setInitialBalance('');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Error creating account.');
    }
  };

  return (
    <div className="form-container">
      <h2>Create New Account</h2>
      <form onSubmit={handleSubmit} className="account-form">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Initial Balance"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          required
          min="0"
        />
        <button type="submit">Create</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default CreateAccount;
