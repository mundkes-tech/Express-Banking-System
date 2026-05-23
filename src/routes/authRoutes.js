const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const { validateRequest } = require('../middlewares/validationMiddleware');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Employee login (no public signup)
router.post(
  '/login',
  [
    body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  authController.login
);

// Logout (protected)
router.post('/logout', protect, authController.logout);

// Refresh access token
router.post('/refresh', authController.refreshAccessToken);

// Development-only quick login (bypass password). Disabled in production.
router.get('/quick-login/:role', authController.quickLogin);

module.exports = router;
