const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: token missing' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Unauthorized: invalid token' });
    }

    const employee = await Employee.findById(decoded.id).select('-password');
    if (!employee) {
      return res.status(401).json({ message: 'Unauthorized: employee not found' });
    }

    if (!employee.isActive) {
      return res.status(401).json({ message: 'Unauthorized: employee account is inactive' });
    }

    req.employee = employee;
    req.employee.lastActivity = Date.now();
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: invalid token' });
  }
};

module.exports = { protect };
