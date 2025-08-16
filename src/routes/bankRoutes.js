const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

router.post('/create', bankController.createAccount);
router.get('/accounts', bankController.getAllAccounts);
router.post('/transfer', bankController.transferFunds);
router.get('/balance/:accountNumber', bankController.checkBalance);

module.exports = router;
