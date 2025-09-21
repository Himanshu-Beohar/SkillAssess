// server/models/UserAssessment.js
const { query } = require('../config/database'); // or however your db helper is named

class UserAssessment {
  static async hasAccess(userId, assessmentId) {
    const res = await query(
      `SELECT 1 FROM user_assessments WHERE user_id = $1 AND assessment_id = $2 AND has_access = true LIMIT 1`,
      [userId, assessmentId]
    );
    return res.rows.length > 0;
  }

  static async grantAccess(userId, assessmentId) {
    const res = await query(
      `INSERT INTO user_assessments (user_id, assessment_id, has_access) VALUES ($1, $2, true) RETURNING *`,
      [userId, assessmentId]
    );
    return res.rows[0];
  }

  static async findByUserAndAssessment(userId, assessmentId) {
    const result = await query(
      `SELECT * FROM user_assessments 
      WHERE user_id = $1 AND assessment_id = $2
      ORDER BY purchased_at DESC
      LIMIT 1`,
      [userId, assessmentId]
    );
    return result.rows[0];
  }

}

module.exports = UserAssessment;
