const Razorpay = require('razorpay');
require('dotenv').config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Validate Razorpay configuration
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('Razorpay keys not configured. Payment features will not work.');
}

module.exports = razorpayInstance;