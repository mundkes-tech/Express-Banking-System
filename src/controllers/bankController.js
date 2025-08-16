const bank = require('../Bank');

exports.createAccount = (req, res) => {
  const { name, balance } = req.body;
  if (!name || balance === undefined) {
    return res.status(400).json({ message: 'Name and balance are required' });
  }
  const account = bank.createAccount(name, balance);
  return res.status(201).json({
    message: 'Account created',
    accountNumber: account.accountNumber
  });
};

exports.getAllAccounts = (req, res) => {
  const accounts = bank.getAllAccounts();
  res.status(200).json(accounts);
};

exports.transferFunds = (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;
  const result = bank.transferFunds(fromAccount, toAccount, amount);
  if (result.success) {
    res.status(200).json({ message: result.message });
  } else {
    res.status(400).json({ message: result.message });
  }
};

exports.checkBalance = (req, res) => {
  const accountNumber = parseInt(req.params.accountNumber);
  const balance = bank.checkBalance(accountNumber);
  if (balance !== null) {
    res.status(200).json({ balance });
  } else {
    res.status(404).json({ message: 'Account not found' });
  }
};
