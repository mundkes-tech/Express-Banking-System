const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const RefreshToken = require('../models/RefreshToken');

const createToken = (employeeId) => {
  return jwt.sign({ id: employeeId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const createRefreshTokenDoc = async (employeeId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const doc = await RefreshToken.create({ token, employee: employeeId, expiresAt });
  return doc;
};

const login = async (req, res, next) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: 'Employee ID and password are required' });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(401).json({ message: 'Invalid employee ID or password' });
    }

    if (!employee.isActive) {
      return res.status(401).json({ message: 'Employee account is inactive' });
    }

    // Check lockout
    if (employee.lockUntil && employee.lockUntil > Date.now()) {
      return res.status(423).json({ message: 'Account locked due to multiple failed login attempts. Try later.' });
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      // increment failed attempts
      employee.failedLoginAttempts = (employee.failedLoginAttempts || 0) + 1;
      if (employee.failedLoginAttempts >= 5) {
        // lock for 15 minutes
        employee.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await employee.save();
      return res.status(401).json({ message: 'Invalid employee ID or password' });
    }

    // Reset failed attempts on successful login
    employee.failedLoginAttempts = 0;
    employee.lockUntil = null;

    // Update last login
    employee.lastLogin = new Date();
    await employee.save();

    // Audit log: login
    try {
      await AuditLog.create({
        actionType: 'login',
        performedBy: employee._id,
        resourceType: 'Employee',
        resourceId: employee.employeeId,
        details: { ip: req.ip },
        status: 'success',
      });
    } catch (err) {
      console.error('Audit log failed:', err && err.message);
    }

    // create refresh token and access token
    const refreshDoc = await createRefreshTokenDoc(employee._id);
    const accessToken = createToken(employee._id);

    return res.status(200).json({
      message: 'Login successful',
      token: accessToken,
      refreshToken: refreshDoc.token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // Revoke refresh token if provided, otherwise revoke all for this employee
    const { refreshToken } = req.body || {};
    try {
      if (refreshToken) {
        await RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
      } else if (req.employee) {
        await RefreshToken.updateMany({ employee: req.employee._id }, { revoked: true });
      }
    } catch (err) {
      console.error('Failed to revoke refresh token:', err && err.message);
    }

    // Audit log: logout (req.employee may be set by protect middleware)
    try {
      if (req.employee) {
        await AuditLog.create({
          actionType: 'logout',
          performedBy: req.employee._id,
          resourceType: 'Employee',
          resourceId: req.employee.employeeId,
          details: { ip: req.ip },
          status: 'success',
        });
      }
    } catch (err) {
      console.error('Audit log failed:', err && err.message);
    }
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    return next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const doc = await RefreshToken.findOne({ token: refreshToken }).populate('employee');
    if (!doc || doc.revoked) return res.status(401).json({ message: 'Invalid refresh token' });
    if (doc.expiresAt < new Date()) return res.status(401).json({ message: 'Refresh token expired' });

    // rotate: revoke old, issue new
    doc.revoked = true;
    await doc.save();
    const newDoc = await createRefreshTokenDoc(doc.employee._id);
    const accessToken = createToken(doc.employee._id);

    return res.status(200).json({ token: accessToken, refreshToken: newDoc.token });
  } catch (err) {
    return next(err);
  }
};

// Development-only quick login: issues tokens for the first active employee matching role
const quickLogin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Quick login is disabled in production' });
    }

    const { role } = req.params;
    if (!role) return res.status(400).json({ message: 'Role is required' });

    const employee = await Employee.findOne({ role: role.toLowerCase(), isActive: true });
    if (!employee) return res.status(404).json({ message: `No active employee found with role ${role}` });

    // update lastLogin
    employee.lastLogin = new Date();
    await employee.save();

    // Audit log
    try {
      await AuditLog.create({
        actionType: 'quick-login',
        performedBy: employee._id,
        resourceType: 'Employee',
        resourceId: employee.employeeId,
        details: { note: 'Dev quick login' },
        status: 'success',
      });
    } catch (err) {
      console.error('Audit log failed:', err && err.message);
    }

    const refreshDoc = await createRefreshTokenDoc(employee._id);
    const accessToken = createToken(employee._id);

    return res.status(200).json({
      message: 'Quick login successful',
      token: accessToken,
      refreshToken: refreshDoc.token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, logout, createToken, refreshAccessToken, quickLogin };
