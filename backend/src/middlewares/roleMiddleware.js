const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ message: 'Unauthorized: Employee not found' });
    }

    if (!allowedRoles.includes(req.employee.role)) {
      return res.status(403).json({
        message: `Forbidden: This action requires ${allowedRoles.join(' or ')} role`,
      });
    }

    return next();
  };
};

const sessionTimeout = (timeoutMinutes = 15) => {
  return (req, res, next) => {
    if (req.employee && req.employee.lastActivity) {
      const now = Date.now();
      const lastActivity = new Date(req.employee.lastActivity).getTime();
      const elapsedMinutes = (now - lastActivity) / (1000 * 60);

      if (elapsedMinutes > timeoutMinutes) {
        return res.status(401).json({ message: 'Session expired. Please login again.' });
      }
    }

    next();
  };
};

module.exports = { requireRole, sessionTimeout };
