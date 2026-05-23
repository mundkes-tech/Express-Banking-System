const express = require('express');
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

// Daily summary - manager/admin
router.get('/daily-summary', requireRole(['manager', 'admin']), reportController.dailySummary);

// Audit logs - admin only
router.get('/audit-logs', requireRole(['admin']), reportController.auditLogs);

module.exports = router;
