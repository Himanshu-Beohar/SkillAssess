const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');

// Protected routes
router.post('/create-order', authenticateToken, validatePayment, paymentController.createOrder);
router.post('/verify', authenticateToken, paymentController.verifyPayment);
router.get('/history', authenticateToken, paymentController.getPaymentHistory);
router.get('/:order_id', authenticateToken, paymentController.getPaymentDetails);

module.exports = router;