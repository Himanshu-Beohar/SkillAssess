const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const Assessment = require('../models/Assessment');
const { query } = require('../config/database');

const paymentController = {
  // async createOrder(req, res) {
  //     try {
  //         const { assessment_id } = req.body; // Only get assessment_id from client
  //         const userId = req.user.id;

  //         // Validate input
  //         if (!assessment_id) {
  //             return res.status(400).json({
  //                 success: false,
  //                 error: 'Assessment ID is required'
  //             });
  //         }

  //         // Get assessment from database
  //         const assessment = await Assessment.findById(assessment_id);
  //         if (!assessment) {
  //             return res.status(404).json({
  //                 success: false,
  //                 error: 'Assessment not found'
  //             });
  //         }

  //         // Validate price from database
  //         if (!assessment.price || assessment.price <= 0) {
  //             return res.status(400).json({
  //                 success: false,
  //                 error: 'Invalid assessment price'
  //             });
  //         }

  //         // Check if user already has access
  //         const hasAccess = await Payment.verifyUserAccess(userId, assessment_id);
  //         if (hasAccess) {
  //             return res.status(400).json({
  //                 success: false,
  //                 error: 'You already have access to this assessment'
  //             });
  //         }

  //         // Create Razorpay order using price from database
  //         const options = {
  //             amount: Math.round(assessment.price * 100), // Convert to paise
  //             currency: 'INR',
  //             receipt: `receipt_${Date.now()}_${userId}`,
  //             notes: {
  //                 userId: userId.toString(),
  //                 assessmentId: assessment_id.toString(),
  //                 assessmentTitle: assessment.title,
  //                 amount: assessment.price // Include for reference
  //             }
  //         };

  //         const order = await razorpay.orders.create(options);

  //         // Save payment record with amount from database
  //         const paymentData = {
  //             user_id: userId,
  //             assessment_id,
  //             amount: assessment.price, // From database, not client
  //             razorpay_order_id: order.id,
  //             status: 'created'
  //         };

  //         await Payment.create(paymentData);

  //         res.json({
  //             success: true,
  //             data: {
  //                 order,
  //                 key: process.env.RAZORPAY_KEY_ID,
  //                 amount: assessment.price // Send back for client confirmation
  //             }
  //         });

  //     } catch (error) {
  //         console.error('Razorpay order creation error:', error);
  //         res.status(500).json({
  //             success: false,
  //             error: 'Failed to create payment order'
  //         });
  //     }
  // },

  // paymentController.js
  async createOrder(req, res) {
    try {
      const { assessment_id } = req.body;
      const userId = req.user.id;

      if (!assessment_id) {
        return res.status(400).json({ success: false, error: 'Assessment ID is required' });
      }

      const assessment = await Assessment.findById(assessment_id);
      if (!assessment) {
        return res.status(404).json({ success: false, error: 'Assessment not found' });
      }

      if (!assessment.price || assessment.price <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid assessment price' });
      }

      // 🔹 Check user access and attempts
      const userAccess = await query(
        `SELECT * FROM user_assessments 
        WHERE user_id=$1 AND assessment_id=$2 AND has_access=true
        ORDER BY purchased_at DESC LIMIT 1`,
        [userId, assessment_id]
      );

      if (userAccess.rows.length > 0) {
        const ua = userAccess.rows[0];
        const maxAttempts = 3;
        const attemptsUsed = ua.attempts_used || 0;

        if (attemptsUsed < maxAttempts) {
          // User still has attempts left → block repurchase
          return res.status(400).json({
            success: false,
            error: `You already have access to this assessment. Attempts left: ${maxAttempts - attemptsUsed}`
          });
        }

        // ✅ Attempts exhausted → allow repurchase (reset attempts after payment success)
      }

      // Create Razorpay order
      const options = {
        amount: Math.round(assessment.price * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}_${userId}`,
        notes: {
          userId: userId.toString(),
          assessmentId: assessment_id.toString(),
          assessmentTitle: assessment.title,
          amount: assessment.price
        }
      };

      const order = await razorpay.orders.create(options);

      // Save payment record
      await Payment.create({
        user_id: userId,
        assessment_id,
        amount: assessment.price,
        razorpay_order_id: order.id,
        status: 'created'
      });

      res.json({
        success: true,
        data: {
          order,
          key: process.env.RAZORPAY_KEY_ID,
          amount: assessment.price
        }
      });

    } catch (error) {
      console.error('Razorpay order creation error:', error);
      res.status(500).json({ success: false, error: 'Failed to create payment order' });
    }
  },


  // async verifyPayment(req, res) {
  //   try {
  //     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  //     // Verify payment signature
  //     const body = razorpay_order_id + "|" + razorpay_payment_id;
  //     const expectedSignature = crypto
  //       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  //       .update(body.toString())
  //       .digest('hex');

  //     if (expectedSignature !== razorpay_signature) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'Invalid payment signature'
  //       });
  //     }

  //     // Update payment status
  //     const payment = await Payment.updateStatus(
  //       razorpay_order_id,
  //       'completed',
  //       razorpay_payment_id,
  //       razorpay_signature
  //     );

  //     res.json({
  //       success: true,
  //       message: 'Payment verified successfully',
  //       data: {
  //         payment
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Payment verification error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'Payment verification failed'
  //     });
  //   }
  // },

  // async verifyPayment(req, res) {
  //   try {
  //     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  //     // Verify payment signature
  //     const body = razorpay_order_id + "|" + razorpay_payment_id;
  //     const expectedSignature = crypto
  //       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  //       .update(body.toString())
  //       .digest('hex');

  //     if (expectedSignature !== razorpay_signature) {
  //       return res.status(400).json({
  //         success: false,
  //         error: 'Invalid payment signature'
  //       });
  //     }

  //     // ✅ Update payment status
  //     const payment = await Payment.updateStatus(
  //       razorpay_order_id,
  //       'completed',
  //       razorpay_payment_id,
  //       razorpay_signature
  //     );

  //     // ✅ Grant assessment access with fresh 3 attempts
  //     if (payment) {
  //       const { user_id, assessment_id } = payment;

  //       await query(
  //         `INSERT INTO user_assessments (user_id, assessment_id, has_access, attempts_used, max_attempts, purchased_at)
  //         VALUES ($1, $2, true, 0, 3, NOW())
  //         ON CONFLICT (user_id, assessment_id)
  //         DO UPDATE SET 
  //           has_access = true,
  //           attempts_used = 0,
  //           max_attempts = 3,
  //           purchased_at = NOW()`,
  //         [user_id, assessment_id]
  //       );
  //     }

  //     res.json({
  //       success: true,
  //       message: 'Payment verified successfully. Access granted.',
  //       data: { payment }
  //     });

  //   } catch (error) {
  //     console.error('Payment verification error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: 'Payment verification failed'
  //     });
  //   }
  // },

  async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      // Verify payment signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment signature'
        });
      }

      // Update payment status
      const payment = await Payment.updateStatus(
        razorpay_order_id,
        'completed',
        razorpay_payment_id,
        razorpay_signature
      );

      // ✅ Insert or update user_assessments with attempt tracking
      // await query(`
      //   INSERT INTO user_assessments (user_id, assessment_id, has_access, attempts_used, purchased_at)
      //   VALUES ($1, $2, true, 0, NOW())
      //   ON CONFLICT (user_id, assessment_id)
      //   DO UPDATE SET has_access = true, attempts_used = 0, purchased_at = NOW()
      // `, [payment.user_id, payment.assessment_id]);

      await query(`
        INSERT INTO user_assessments (user_id, assessment_id, has_access, attempts_used, purchased_at)
        VALUES ($1, $2, true, 0, NOW())
        ON CONFLICT (user_id, assessment_id)
        DO UPDATE SET attempts_used = 0, purchased_at = NOW(), has_access=true
      `, [payment.user_id, payment.assessment_id]);

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: { payment }
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment verification failed'
      });
    }
  },



  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const payments = await Payment.findByUserId(userId);

      res.json({
        success: true,
        data: {
          payments,
          count: payments.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history'
      });
    }
  },

  async getPaymentDetails(req, res) {
    try {
      const { order_id } = req.params;
      const payment = await Payment.findByOrderId(order_id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      // Ensure user can only access their own payments
      if (payment.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          payment
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment details'
      });
    }
  }
};

module.exports = paymentController;