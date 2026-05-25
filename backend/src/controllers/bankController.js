const mongoose = require('mongoose');
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const Transaction = require('../models/Transaction');
const { detectSuspiciousActivity } = require('../middlewares/suspiciousActivity');

const TRANSACTION_LIMITS = {
  teller: 50000,
  manager: 500000,
  admin: Number.MAX_SAFE_INTEGER,
};

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
};

const generateAccountNumber = async () => {
  let accountNumber;
  let existing;

  do {
    accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    existing = await Account.findOne({ accountNumber });
  } while (existing);

  return accountNumber;
};

const getAccountByNumber = async (accountNumber) => {
  return Account.findOne({ accountNumber });
};

// Helper to check employee role
const checkEmployeeRole = (employee, allowedRoles) => {
  return allowedRoles.includes(employee.role);
};

const getRoleLimit = (role) => {
  return TRANSACTION_LIMITS[role] ?? TRANSACTION_LIMITS.teller;
};

const shouldRequireApproval = (employee, amount) => {
  return amount >= getRoleLimit(employee.role);
};

const generateCustomerId = () => {
  return `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const findPendingTransaction = async (transactionId) => {
  return Transaction.findOne({ transactionId, status: 'pending' });
};

const getAccountOrThrow = async (accountNumber) => {
  const account = await getAccountByNumber(accountNumber);
  if (!account) {
    const error = new Error('Account not found');
    error.statusCode = 404;
    throw error;
  }
  return account;
};

const processTransaction = async (transaction) => {
  const snapshots = {};

  try {
    if (transaction.type === 'deposit') {
      const account = await getAccountOrThrow(transaction.accountNumber);
      if (account.status !== 'active') {
        throw new Error('Only active accounts can receive deposits');
      }

      snapshots.account = { balance: account.balance };
      account.balance += transaction.amount;
      account.transactions.push({
        type: 'DEPOSIT',
        amount: transaction.amount,
        description: `Deposit via ${transaction.transactionId}`,
      });

      await account.save();
    }

    if (transaction.type === 'withdraw') {
      const account = await getAccountOrThrow(transaction.accountNumber);
      if (account.status !== 'active') {
        throw new Error('Only active accounts can process withdrawals');
      }
      if (account.balance < transaction.amount) {
        throw new Error('Insufficient balance');
      }

      snapshots.account = { balance: account.balance };
      account.balance -= transaction.amount;
      account.transactions.push({
        type: 'WITHDRAW',
        amount: transaction.amount,
        description: `Withdrawal via ${transaction.transactionId}`,
      });

      await account.save();
    }

    if (transaction.type === 'transfer') {
      const from = await getAccountOrThrow(transaction.fromAccountNumber);
      const to = await getAccountOrThrow(transaction.toAccountNumber);

      if (from.status !== 'active' || to.status !== 'active') {
        throw new Error('Both accounts must be active for transfer');
      }

      if (from.balance < transaction.amount) {
        throw new Error('Insufficient balance');
      }

      snapshots.from = { balance: from.balance };
      snapshots.to = { balance: to.balance };
      from.balance -= transaction.amount;
      to.balance += transaction.amount;

      from.transactions.push({
        type: 'TRANSFER_OUT',
        amount: transaction.amount,
        description: `Transferred to account ${to.accountNumber}`,
        relatedAccountNumber: to.accountNumber,
      });

      to.transactions.push({
        type: 'TRANSFER_IN',
        amount: transaction.amount,
        description: `Received from account ${from.accountNumber}`,
        relatedAccountNumber: from.accountNumber,
      });

      await Promise.all([from.save(), to.save()]);
    }

    transaction.status = 'approved';
    transaction.status = 'success';
    transaction.processedAt = new Date();
    transaction.failureReason = '';
    await transaction.save();

    // Audit log: transaction processed
    try {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        actionType: 'transaction_processed',
        performedBy: transaction.requestedBy,
        resourceType: 'Transaction',
        resourceId: transaction.transactionId,
        details: { type: transaction.type, amount: transaction.amount },
        ipAddress: '',
        status: 'success',
      });
    } catch (err) {
      console.error('Audit log error:', err && err.message);
    }

    return transaction;
  } catch (error) {
    const expectedMessages = new Set([
      'Insufficient balance',
      'Only active accounts can receive deposits',
      'Only active accounts can process withdrawals',
      'Both accounts must be active for transfer',
    ]);

    if (!error.statusCode && expectedMessages.has(error.message)) {
      error.statusCode = 400;
    }

    if (transaction.type === 'deposit' || transaction.type === 'withdraw') {
      const account = await Account.findOne({ accountNumber: transaction.accountNumber });
      if (account && snapshots.account) {
        account.balance = snapshots.account.balance;
        await account.save();
      }
    }

    if (transaction.type === 'transfer') {
      const from = await Account.findOne({ accountNumber: transaction.fromAccountNumber });
      const to = await Account.findOne({ accountNumber: transaction.toAccountNumber });

      if (from && snapshots.from) {
        from.balance = snapshots.from.balance;
        await from.save();
      }

      if (to && snapshots.to) {
        to.balance = snapshots.to.balance;
        await to.save();
      }
    }

    transaction.status = 'failed';
    transaction.failureReason = error.message;
    transaction.processedAt = new Date();
    await transaction.save();

    // Audit log: transaction failed
    try {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        actionType: 'transaction_failed',
        performedBy: transaction.requestedBy,
        resourceType: 'Transaction',
        resourceId: transaction.transactionId,
        details: { error: error.message },
        ipAddress: '',
        status: 'failed',
      });
    } catch (err) {
      console.error('Audit log error:', err && err.message);
    }
    throw error;
  }
};

const createTransactionRecord = async ({
  type,
  amount,
  requestedBy,
  accountNumber = null,
  fromAccountNumber = null,
  toAccountNumber = null,
  approvalRequired = false,
  notes = '',
}) => {
  return Transaction.create({
    transactionId: generateTransactionId(),
    type,
    status: approvalRequired ? 'pending' : 'approved',
    amount,
    accountNumber,
    fromAccountNumber,
    toAccountNumber,
    requestedBy,
    approvalRequired,
    notes,
  });
};

exports.createAccount = async (req, res, next) => {
  try {
    // Only teller and manager can create accounts
    if (!checkEmployeeRole(req.employee, ['teller', 'manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to create account' });
    }

    const { customerId, accountType = 'savings', initialBalance = 0 } = req.body;

    // Import Customer model
    const Customer = require('../models/Customer');

    // Verify customer exists and KYC is verified
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (customer.kyc.status !== 'verified') {
      return res.status(400).json({
        message: 'Customer KYC must be verified before creating account',
      });
    }

    if (customer.status !== 'active') {
      return res.status(400).json({
        message: 'Customer must be active to create account',
      });
    }

    const accountNumber = await generateAccountNumber();

    const account = await Account.create({
      accountNumber,
      customerId: customer._id,
      accountType,
      balance: initialBalance,
      createdBy: req.employee._id,
      transactions: [
        {
          type: 'CREATE',
          amount: initialBalance,
          description: `Account created by ${req.employee.employeeId}`,
        },
      ],
    });

    return res.status(201).json({
      message: 'Account created successfully',
      account,
    });
  } catch (error) {
    return next(error);
  }
};

exports.openAccount = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    if (!checkEmployeeRole(req.employee, ['teller', 'manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to open account' });
    }

    const {
      customerId,
      name,
      email,
      phone,
      address = {},
      accountType = 'savings',
      initialBalance = 0,
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    session.startTransaction();

    let customer = null;

    if (customerId) {
      customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Customer not found' });
      }
      if (customer.status === 'blocked' || customer.status === 'closed') {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Customer account is blocked or closed' });
      }
    } else {
      if (!name || !normalizedEmail || !normalizedPhone) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Customer name, email, and phone are required' });
      }

      customer = await Customer.findOne({
        $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      }).session(session);

      if (!customer) {
        customer = await Customer.create([
          {
            customerId: generateCustomerId(),
            name,
            email: normalizedEmail,
            phone: normalizedPhone,
            address,
            createdBy: req.employee._id,
            status: 'active',
            kyc: { status: 'not_started' },
          },
        ], { session }).then((docs) => docs[0]);
      } else if (customer.status === 'blocked' || customer.status === 'closed') {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Customer account is blocked or closed' });
      }
    }

    if (customer && customer.status !== 'active') {
      customer.status = 'active';
      await customer.save({ session });
    }

    const accountNumber = await generateAccountNumber();

    const account = await Account.create([
      {
        accountNumber,
        customerId: customer._id,
        accountType,
        balance: Number(initialBalance) || 0,
        createdBy: req.employee._id,
        transactions: [
          {
            type: 'CREATE',
            amount: Number(initialBalance) || 0,
            description: `Account opened by ${req.employee.employeeId}`,
          },
        ],
      },
    ], { session }).then((docs) => docs[0]);

    await AuditLog.create([
      {
        actionType: 'account_opened',
        performedBy: req.employee._id,
        resourceType: 'Account',
        resourceId: account.accountNumber.toString(),
        details: {
          customerId: customer.customerId,
          accountType,
          initialBalance: Number(initialBalance) || 0,
        },
        ipAddress: req.ip,
        status: 'success',
      },
    ], { session });

    await session.commitTransaction();

    return res.status(201).json({
      message: 'Account opened successfully',
      customer,
      account,
    });
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortError) {
      console.error('Transaction abort failed:', abortError && abortError.message);
    }
    return next(error);
  } finally {
    session.endSession();
  }
};

exports.getAllAccounts = async (req, res, next) => {
  try {
    const { customerId } = req.query;
    const filter = {};

    if (customerId) {
      filter.customerId = customerId;
    }

    const accounts = await Account.find(filter)
      .populate('customerId', 'name customerId email phone')
      .populate('createdBy', 'name employeeId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Accounts fetched successfully',
      data: accounts,
    });
  } catch (error) {
    return next(error);
  }
};

exports.transferFunds = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['teller', 'manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to transfer funds' });
    }

    const { fromAccountNumber, toAccountNumber, amount, description = '' } = req.body;
    const transferAmount = Number(amount);

    if (Number.isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (fromAccountNumber === toAccountNumber) {
      return res.status(400).json({ message: 'Sender and receiver accounts must differ' });
    }

    const from = await getAccountByNumber(fromAccountNumber);
    const to = await getAccountByNumber(toAccountNumber);

    if (!from || !to) {
      return res.status(404).json({ message: 'One or both accounts not found' });
    }

    const approvalRequired = shouldRequireApproval(req.employee, transferAmount);
    const transaction = await createTransactionRecord({
      type: 'transfer',
      amount: transferAmount,
      requestedBy: req.employee._id,
      fromAccountNumber,
      toAccountNumber,
      approvalRequired,
      notes: description || `Transfer from ${fromAccountNumber} to ${toAccountNumber}`,
    });

    try {
      detectSuspiciousActivity(req.employee._id, { action: 'transfer', amount: transferAmount, fromAccountNumber, toAccountNumber });
    } catch (e) {
      console.error('suspiciousActivity error:', e && e.message);
    }

    if (approvalRequired) {
      return res.status(202).json({
        message: 'Transfer submitted for approval',
        transaction,
      });
    }

    const processed = await processTransaction(transaction);
    return res.status(200).json({
      message: 'Funds transferred successfully',
      transaction: processed,
    });
  } catch (error) {
    return next(error);
  }
};

exports.depositFunds = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['teller', 'manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to deposit funds' });
    }

    const { accountNumber, amount, description = '' } = req.body;

    const account = await getAccountByNumber(accountNumber);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const approvalRequired = shouldRequireApproval(req.employee, amount);
    const transaction = await createTransactionRecord({
      type: 'deposit',
      amount,
      requestedBy: req.employee._id,
      accountNumber,
      approvalRequired,
      notes: description || 'Cash deposit',
    });

    try {
      detectSuspiciousActivity(req.employee._id, { action: 'deposit', amount, accountNumber });
    } catch (e) {
      console.error('suspiciousActivity error:', e && e.message);
    }

    if (approvalRequired) {
      return res.status(202).json({
        message: 'Deposit submitted for approval',
        transaction,
      });
    }

    const processed = await processTransaction(transaction);
    return res.status(200).json({
      message: 'Deposit successful',
      transaction: processed,
    });
  } catch (error) {
    return next(error);
  }
};

exports.withdrawFunds = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['teller', 'manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to withdraw funds' });
    }

    const { accountNumber, amount, description = '' } = req.body;

    const account = await getAccountByNumber(accountNumber);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const approvalRequired = shouldRequireApproval(req.employee, amount);
    const transaction = await createTransactionRecord({
      type: 'withdraw',
      amount,
      requestedBy: req.employee._id,
      accountNumber,
      approvalRequired,
      notes: description || 'Cash withdrawal',
    });

    try {
      detectSuspiciousActivity(req.employee._id, { action: 'withdraw', amount, accountNumber });
    } catch (e) {
      console.error('suspiciousActivity error:', e && e.message);
    }

    if (approvalRequired) {
      return res.status(202).json({
        message: 'Withdrawal submitted for approval',
        transaction,
      });
    }

    const processed = await processTransaction(transaction);
    return res.status(200).json({
      message: 'Withdrawal successful',
      transaction: processed,
    });
  } catch (error) {
    return next(error);
  }
};

exports.checkBalance = async (req, res, next) => {
  try {
    const accountNumber = Number(req.params.accountNumber);
    const account = await getAccountByNumber(accountNumber);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.status(200).json({
      accountNumber: account.accountNumber,
      balance: account.balance,
      status: account.status,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getTransactionHistory = async (req, res, next) => {
  try {
    const accountNumber = Number(req.params.accountNumber);
    const account = await getAccountByNumber(accountNumber);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    return res.status(200).json({
      accountNumber: account.accountNumber,
      transactions: account.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateAccount = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to update account' });
    }

    const accountNumber = Number(req.params.accountNumber);
    const { status } = req.body;

    const account = await getAccountByNumber(accountNumber);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (status !== undefined) {
      account.status = status;
    }

    await account.save();

    return res.status(200).json({ message: 'Account updated successfully', account });
  } catch (error) {
    return next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to delete account' });
    }

    const accountNumber = Number(req.params.accountNumber);
    const account = await getAccountByNumber(accountNumber);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await account.deleteOne();
    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

exports.getPendingTransactions = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to view pending transactions' });
    }

    const transactions = await Transaction.find({ status: 'pending' })
      .populate('requestedBy', 'name employeeId role')
      .sort({ createdAt: -1 });

    try {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        actionType: 'view_pending_transactions',
        performedBy: req.employee._id,
        resourceType: 'Transaction',
        resourceId: '',
        details: { count: transactions.length },
        ipAddress: req.ip,
        status: 'info',
      });
    } catch (err) {
      console.error('Audit log error:', err && err.message);
    }

    return res.status(200).json(transactions);
  } catch (error) {
    return next(error);
  }
};

exports.approveTransaction = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to approve transactions' });
    }

    const { transactionId } = req.params;
    const transaction = await findPendingTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.approvedBy = req.employee._id;
    try {
      const processed = await processTransaction(transaction);

      try {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
          actionType: 'transaction_approved',
          performedBy: req.employee._id,
          resourceType: 'Transaction',
          resourceId: transaction.transactionId,
          details: { type: transaction.type, amount: transaction.amount },
          ipAddress: req.ip,
          status: 'success',
        });
      } catch (err) {
        console.error('Audit log error:', err && err.message);
      }

      return res.status(200).json({
        message: 'Transaction approved successfully',
        transaction: processed,
      });
    } catch (err) {
      return next(err);
    }
  } catch (error) {
    return next(error);
  }
};

exports.rejectTransaction = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to reject transactions' });
    }

    const { transactionId } = req.params;
    const { rejectionReason = 'Rejected by approver' } = req.body;
    const transaction = await findPendingTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.status = 'rejected';
    transaction.approvedBy = req.employee._id;
    transaction.rejectionReason = rejectionReason;
    transaction.processedAt = new Date();
    await transaction.save();

    try {
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        actionType: 'transaction_rejected',
        performedBy: req.employee._id,
        resourceType: 'Transaction',
        resourceId: transaction.transactionId,
        details: { reason: rejectionReason },
        ipAddress: req.ip,
        status: 'info',
      });
    } catch (err) {
      console.error('Audit log error:', err && err.message);
    }

    return res.status(200).json({
      message: 'Transaction rejected successfully',
      transaction,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAllTransactions = async (req, res, next) => {
  try {
    if (!checkEmployeeRole(req.employee, ['manager', 'admin'])) {
      return res.status(403).json({ message: 'Insufficient permissions to view all transactions' });
    }

    const { status, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter)
      .populate('requestedBy', 'name employeeId role')
      .populate('approvedBy', 'name employeeId role')
      .sort({ createdAt: -1 });

    return res.status(200).json(transactions);
  } catch (error) {
    return next(error);
  }
};

exports.cancelTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'pending' || transaction.status === 'rejected' || transaction.status === 'failed') {
      const requesterId = transaction.requestedBy && transaction.requestedBy._id ? transaction.requestedBy._id : transaction.requestedBy;
      const isRequester = String(requesterId) === String(req.employee._id);

      if (!isRequester && !checkEmployeeRole(req.employee, ['manager', 'admin'])) {
        return res.status(403).json({ message: 'Insufficient permissions to cancel this transaction' });
      }
      transaction.status = 'cancelled';
      transaction.processedAt = new Date();
      await transaction.save();

      await AuditLog.create({
        actionType: 'transaction_cancelled',
        performedBy: req.employee._id,
        resourceType: 'Transaction',
        resourceId: transaction.transactionId,
        details: { reason: 'cancelled by user' },
        ipAddress: req.ip,
        status: 'info',
      });

      return res.status(200).json({ message: 'Transaction cancelled', transaction });
    }

    if (transaction.status === 'success') {
      const processedAt = transaction.processedAt ? new Date(transaction.processedAt) : null;
      const now = new Date();
      const minutesSince = processedAt ? (now - processedAt) / (1000 * 60) : Infinity;

      const requesterId = transaction.requestedBy && transaction.requestedBy._id ? transaction.requestedBy._id : transaction.requestedBy;
      const isRequester = String(requesterId) === String(req.employee._id);
      if (!isRequester) {
        return res.status(403).json({ message: 'Only the requester can undo this transaction' });
      }

      if (minutesSince > 5) {
        return res.status(400).json({ message: 'Undo window has passed' });
      }

      if (transaction.type === 'deposit') {
        const account = await Account.findOne({ accountNumber: transaction.accountNumber });
        if (!account) return res.status(404).json({ message: 'Account not found to revert deposit' });
        account.balance -= transaction.amount;
        account.transactions.push({ type: 'REVERSAL', amount: -transaction.amount, description: `Reversal of ${transaction.transactionId}` });
        await account.save();
      }

      if (transaction.type === 'withdraw') {
        const account = await Account.findOne({ accountNumber: transaction.accountNumber });
        if (!account) return res.status(404).json({ message: 'Account not found to revert withdrawal' });
        account.balance += transaction.amount;
        account.transactions.push({ type: 'REVERSAL', amount: transaction.amount, description: `Reversal of ${transaction.transactionId}` });
        await account.save();
      }

      if (transaction.type === 'transfer') {
        const from = await Account.findOne({ accountNumber: transaction.fromAccountNumber });
        const to = await Account.findOne({ accountNumber: transaction.toAccountNumber });
        if (!from || !to) return res.status(404).json({ message: 'Accounts not found to revert transfer' });
        from.balance += transaction.amount;
        to.balance -= transaction.amount;
        from.transactions.push({ type: 'REVERSAL', amount: transaction.amount, description: `Reversal of ${transaction.transactionId}`, relatedAccountNumber: to.accountNumber });
        to.transactions.push({ type: 'REVERSAL', amount: -transaction.amount, description: `Reversal of ${transaction.transactionId}`, relatedAccountNumber: from.accountNumber });
        await Promise.all([from.save(), to.save()]);
      }

      transaction.status = 'reversed';
      transaction.reversedBy = req.employee._id;
      transaction.reversedAt = new Date();
      await transaction.save();

      await AuditLog.create({
        actionType: 'transaction_reversed',
        performedBy: req.employee._id,
        resourceType: 'Transaction',
        resourceId: transaction.transactionId,
        details: { type: transaction.type, amount: transaction.amount },
        ipAddress: req.ip,
        status: 'success',
      });

      return res.status(200).json({ message: 'Transaction reversed', transaction });
    }

    return res.status(400).json({ message: 'Transaction cannot be cancelled' });
  } catch (error) {
    return next(error);
  }
};
