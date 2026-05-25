const express = require('express');
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');

const router = express.Router();

// Protect all routes - require employee authentication
router.use(protect);

// Create customer
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
    body('address').optional().isObject(),
  ],
  validateRequest,
  customerController.createCustomer
);

// Get all customers
router.get('/', customerController.getAllCustomers);

// Get pending KYC verifications (manager/admin only)
router.get('/kyc/pending', customerController.getPendingKYC);

// Get customer by ID
router.get('/:customerId', customerController.getCustomerById);

// Update customer
router.put(
  '/:customerId',
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().matches(/^[0-9]{10}$/),
    body('address').optional().isObject(),
  ],
  validateRequest,
  customerController.updateCustomer
);

// Start KYC verification
router.post(
  '/:customerId/kyc/start',
  [
    body('idType').isIn(['aadhar', 'pan', 'passport', 'driving_license']).withMessage('Valid ID type required'),
    body('idNumber').trim().notEmpty().withMessage('ID number is required'),
    body('idDocument').optional().isString(),
  ],
  validateRequest,
  customerController.startKYC
);

// Verify KYC (manager/admin only)
router.post(
  '/:customerId/kyc/verify',
  requireRole(['manager', 'admin']),
  [
    body('approved').isBoolean().withMessage('Approved status is required'),
    body('rejectionReason').optional().trim(),
  ],
  validateRequest,
  customerController.verifyKYC
);

// Block/unblock customer
router.post(
  '/:customerId/block',
  requireRole(['manager', 'admin']),
  [body('blocked').isBoolean().withMessage('Blocked status is required')],
  validateRequest,
  customerController.blockCustomer
);

module.exports = router;
