const { query } = require('../config/database');

class Result {
  static async create(resultData) {
    const { user_id, assessment_id, score, total_questions, time_taken } = resultData;
    
    const result = await query(
      `INSERT INTO results (user_id, assessment_id, score, total_questions, time_taken) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, assessment_id, score, total_questions, time_taken || 0]
    );
    
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await query(`
      SELECT r.*, a.title as assessment_title, a.description as assessment_description
      FROM results r
      JOIN assessments a ON r.assessment_id = a.id
      WHERE r.user_id = $1
      ORDER BY r.completed_at DESC
    `, [userId]);
    
    return result.rows;
  }

  static async findByAssessmentId(assessmentId) {
    const result = await query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM results r
      JOIN users u ON r.user_id = u.id
      WHERE r.assessment_id = $1
      ORDER BY r.score DESC, r.time_taken ASC
    `, [assessmentId]);
    
    return result.rows;
  }

  static async findUserAssessmentResult(userId, assessmentId) {
    const result = await query(`
      SELECT r.*, a.title as assessment_title
      FROM results r
      JOIN assessments a ON r.assessment_id = a.id
      WHERE r.user_id = $1 AND r.assessment_id = $2
      ORDER BY r.completed_at DESC
      LIMIT 1
    `, [userId, assessmentId]);
    
    return result.rows[0];
  }

  static async getLeaderboard(assessmentId, limit = 10) {
    const result = await query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM results r
      JOIN users u ON r.user_id = u.id
      WHERE r.assessment_id = $1
      ORDER BY r.score DESC, r.time_taken ASC
      LIMIT $2
    `, [assessmentId, limit]);
    
    return result.rows;
  }

  static async delete(resultId) {
    await query('DELETE FROM results WHERE id = $1', [resultId]);
    return true;
  }
}

module.exports = Result;