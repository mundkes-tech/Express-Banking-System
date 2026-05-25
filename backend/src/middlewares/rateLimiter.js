const rateLimit = require('express-rate-limit');

// Create a rate limiter that keys by employee ID when available, otherwise by IP
const createPerEmployeeRateLimiter = (opts = {}) => {
  const { windowMs = 60 * 1000, max = 60 } = opts;
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req /*, res*/) => {
      if (req.employee && req.employee._id) {
        return String(req.employee._id);
      }
      return rateLimit.ipKeyGenerator(req.ip);
    },
  });
};

module.exports = { createPerEmployeeRateLimiter };
