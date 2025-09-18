const { query } = require('../config/database');

class Assessment {
  static async create(assessmentData) {
    const { title, description, price, is_premium, created_by } = assessmentData;
    
    const result = await query(
      `INSERT INTO assessments (title, description, price, is_premium, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, description, price || 0, is_premium || false, created_by]
    );
    
    return result.rows[0];
  }

  static async findAll() {
    const result = await query(`
      SELECT a.*, u.name as creator_name 
      FROM assessments a 
      LEFT JOIN users u ON a.created_by = u.id 
      ORDER BY a.created_at DESC
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(`
      SELECT a.*, u.name as creator_name 
      FROM assessments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await query(`
      SELECT a.*, u.name as creator_name 
      FROM assessments a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.created_by = $1 
      ORDER BY a.created_at DESC
    `, [userId]);
    return result.rows;
  }

  static async update(id, updates) {
    const { title, description, price, is_premium } = updates;
    const result = await query(
      `UPDATE assessments 
       SET title = $1, description = $2, price = $3, is_premium = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [title, description, price, is_premium, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM assessments WHERE id = $1', [id]);
    return true;
  }

  static async getQuestions(assessmentId) {
    const result = await query(
      'SELECT * FROM questions WHERE assessment_id = $1 ORDER BY created_at',
      [assessmentId]
    );
    return result.rows;
  }
}

module.exports = Assessment;