const AuditLog = require('../models/AuditLog');
const Transaction = require('../models/Transaction');

// Basic suspicious activity detector used after sensitive actions
// For now: logs when an employee creates > N transactions over a short period
const detectSuspiciousActivity = async (employeeId, context = {}) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await Transaction.countDocuments({
      requestedBy: employeeId,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentCount >= 20) {
      await AuditLog.create({
        actionType: 'suspicious_activity',
        performedBy: employeeId,
        resourceType: 'Transaction',
        details: { recentCount, context },
        status: 'flagged',
      });
      return true;
    }
  } catch (err) {
    console.error('suspiciousActivity detector error:', err && err.message);
  }
  return false;
};

module.exports = { detectSuspiciousActivity };
