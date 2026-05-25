const express = require('express');
const { body } = require('express-validator');
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, requireRole(['admin']));

// Create new employee
router.post(
  '/',
  [
    body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'manager', 'teller']).withMessage('Invalid role'),
  ],
  validateRequest,
  employeeController.createEmployee
);

// List all employees
router.get('/', employeeController.listEmployees);

// Update employee
router.patch(
  '/:employeeId',
  [
    body('role').optional().isIn(['admin', 'manager', 'teller']).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  ],
  validateRequest,
  employeeController.updateEmployee
);

module.exports = router;
