import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateAccount from './pages/CreateAccount';
import Dashboard from './pages/Dashboard';
import TransferFunds from './pages/TransferFunds';
import CheckBalance from './pages/CheckBalance';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transfer" element={<TransferFunds />} />
        <Route path="/balance" element={<CheckBalance />} />
      </Routes>
    </Router>
  );
}

export default App;
