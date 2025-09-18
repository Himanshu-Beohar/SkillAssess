const { query } = require('../config/database');

class Payment {
  static async create(paymentData) {
    const { user_id, assessment_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, status } = paymentData;
    
    const result = await query(
      `INSERT INTO payments (user_id, assessment_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [user_id, assessment_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, status || 'pending']
    );
    
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await query(`
      SELECT p.*, a.title as assessment_title
      FROM payments p
      JOIN assessments a ON p.assessment_id = a.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);
    
    return result.rows;
  }

  static async findByOrderId(orderId) {
    const result = await query(
      'SELECT * FROM payments WHERE razorpay_order_id = $1',
      [orderId]
    );
    
    return result.rows[0];
  }

  static async updateStatus(orderId, status, paymentId = null, signature = null) {
    const result = await query(
      `UPDATE payments 
       SET status = $1, razorpay_payment_id = COALESCE($2, razorpay_payment_id), 
           razorpay_signature = COALESCE($3, razorpay_signature), updated_at = CURRENT_TIMESTAMP 
       WHERE razorpay_order_id = $4 
       RETURNING *`,
      [status, paymentId, signature, orderId]
    );
    
    return result.rows[0];
  }

  static async verifyUserAccess(userId, assessmentId) {
    const result = await query(`
      SELECT * FROM payments 
      WHERE user_id = $1 AND assessment_id = $2 AND status = 'completed'
    `, [userId, assessmentId]);
    
    return result.rows.length > 0;
  }

  static async getRevenueStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_revenue,
        AVG(amount) as average_order_value,
        COUNT(DISTINCT user_id) as total_customers
      FROM payments 
      WHERE status = 'completed'
    `);
    
    return result.rows[0];
  }
}

module.exports = Payment;