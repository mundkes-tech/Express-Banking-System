const express = require('express');
const { body, param } = require('express-validator');

const router = express.Router();
const bankController = require('../controllers/bankController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validationMiddleware');

router.use(protect);

router.post(
	'/create',
	[
		body('customerId').trim().notEmpty().withMessage('Customer ID is required'),
		body('accountType').optional().isIn(['savings', 'current', 'fixed_deposit']).withMessage('Invalid account type'),
		body('initialBalance').optional().isFloat({ min: 0 }).withMessage('Initial balance must be a non-negative number'),
	],
	validateRequest,
	bankController.createAccount
);

router.post(
	'/open-account',
	[
		body('name').optional().trim(),
		body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
		body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
		body('accountType').optional().isIn(['savings', 'current', 'fixed_deposit']).withMessage('Invalid account type'),
		body('initialBalance').optional().isFloat({ min: 0 }).withMessage('Initial balance must be a non-negative number'),
	],
	validateRequest,
	bankController.openAccount
);

router.get('/accounts', bankController.getAllAccounts);

router.post(
	'/transfer',
	[
		body('fromAccountNumber').isInt({ min: 1 }).withMessage('fromAccountNumber must be valid'),
		body('toAccountNumber').isInt({ min: 1 }).withMessage('toAccountNumber must be valid'),
		body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
	],
	validateRequest,
	bankController.transferFunds
);

router.post(
	'/deposit',
	[
		body('accountNumber').isInt({ min: 1 }).withMessage('accountNumber must be valid'),
		body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
	],
	validateRequest,
	bankController.depositFunds
);

router.post(
	'/withdraw',
	[
		body('accountNumber').isInt({ min: 1 }).withMessage('accountNumber must be valid'),
		body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
	],
	validateRequest,
	bankController.withdrawFunds
);

router.get(
	'/balance/:accountNumber(\\d+)',
	[param('accountNumber').isInt({ min: 1 }).withMessage('accountNumber must be valid')],
	validateRequest,
	bankController.checkBalance
);

router.get(
	'/transactions/:accountNumber(\\d+)',
	[param('accountNumber').isInt({ min: 1 }).withMessage('accountNumber must be valid')],
	validateRequest,
	bankController.getTransactionHistory
);

router.get('/transactions/pending', bankController.getPendingTransactions);

router.patch(
	'/accounts/:accountNumber(\\d+)',
	[
		param('accountNumber').isInt({ min: 1 }).withMessage('accountNumber must be valid'),
		body('status').optional().isIn(['active', 'frozen', 'closed']).withMessage('Invalid status'),
	],
	validateRequest,
	bankController.updateAccount
);

router.delete(
	'/accounts/:accountNumber(\\d+)',
	[param('accountNumber').isInt({ min: 1 }).withMessage('accountNumber must be valid')],
	validateRequest,
	bankController.deleteAccount
);

router.get('/transactions', bankController.getAllTransactions);

router.post(
	'/transactions/:transactionId/approve',
	[
		param('transactionId').trim().notEmpty().withMessage('transactionId is required'),
	],
	validateRequest,
	bankController.approveTransaction
);

router.post(
	'/transactions/:transactionId/reject',
	[
		param('transactionId').trim().notEmpty().withMessage('transactionId is required'),
		body('rejectionReason').optional().trim(),
	],
	validateRequest,
	bankController.rejectTransaction
);

router.post(
	'/transactions/:transactionId/cancel',
	[
		param('transactionId').trim().notEmpty().withMessage('transactionId is required'),
	],
	validateRequest,
	bankController.cancelTransaction
);

module.exports = router;
