const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const AuditLog = require('../models/AuditLog');

// Simple daily summary report
exports.dailySummary = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const transactions = await Transaction.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      status: 'success',
    });

    const summary = transactions.reduce(
      (acc, tx) => {
        acc.count += 1;
        acc.totalAmount += tx.amount;
        acc.byType[tx.type] = (acc.byType[tx.type] || 0) + tx.amount;
        return acc;
      },
      { count: 0, totalAmount: 0, byType: {} }
    );

    // Simple total balances
    const accounts = await Account.find({});
    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

    return res.status(200).json({
      date: todayStart.toISOString(),
      summary,
      totalAccounts: accounts.length,
      totalBalance,
    });
  } catch (error) {
    return next(error);
  }
};

exports.auditLogs = async (req, res, next) => {
  try {
    const { actionType, status, resourceType, limit = 100 } = req.query;
    const filter = {};

    if (actionType) filter.actionType = actionType;
    if (status) filter.status = status;
    if (resourceType) filter.resourceType = resourceType;

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name employeeId role')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 100, 500));

    return res.status(200).json({
      message: 'Audit logs retrieved successfully',
      data: logs,
    });
  } catch (error) {
    return next(error);
  }
};
