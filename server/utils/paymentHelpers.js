const crypto = require('crypto');
const razorpay = require('../config/razorpay');

const paymentHelpers = {
  // Generate Razorpay order
  async createRazorpayOrder(amount, currency, receipt, notes) {
    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency || 'INR',
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {}
      };

      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  },

  // Verify payment signature
  verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      const body = orderId + "|" + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  },

  // Format currency for display
  formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  },

  // Validate payment amount
  validatePaymentAmount(amount) {
    const numericAmount = parseFloat(amount);
    return !isNaN(numericAmount) && numericAmount > 0;
  },

  // Generate receipt ID
  generateReceiptId(prefix = 'RCPT') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp}_${random}`;
  }
};

module.exports = paymentHelpers;