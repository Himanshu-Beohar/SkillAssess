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

  static async getQuestionsWithDifficulty(assessmentId, numQuestions) {
        try {
            // Get all questions grouped by difficulty level
            const result = await query(`
                SELECT * FROM questions 
                WHERE assessment_id = $1 
                ORDER BY d_level, RANDOM()
            `, [assessmentId]);

            const questions = result.rows;
            
            if (questions.length === 0) {
                return [];
            }

            // Group questions by difficulty level
            const questionsByLevel = {
                1: questions.filter(q => q.d_level === 1),
                2: questions.filter(q => q.d_level === 2),
                3: questions.filter(q => q.d_level === 3)
            };

            // Calculate distribution
            const totalQuestions = questions.length;
            const level1Count = questionsByLevel[1].length;
            const level2Count = questionsByLevel[2].length;
            const level3Count = questionsByLevel[3].length;

            // Calculate proportional distribution
            let level1Needed = Math.round((level1Count / totalQuestions) * numQuestions);
            let level2Needed = Math.round((level2Count / totalQuestions) * numQuestions);
            let level3Needed = numQuestions - level1Needed - level2Needed;

            // Adjust if rounding causes issues
            const totalNeeded = level1Needed + level2Needed + level3Needed;
            if (totalNeeded !== numQuestions) {
                level3Needed += (numQuestions - totalNeeded);
            }

            // Ensure we don't request more questions than available
            level1Needed = Math.min(level1Needed, level1Count);
            level2Needed = Math.min(level2Needed, level2Count);
            level3Needed = Math.min(level3Needed, level3Count);

            // Select questions from each level
            const selectedQuestions = [
                ...questionsByLevel[1].slice(0, level1Needed),
                ...questionsByLevel[2].slice(0, level2Needed),
                ...questionsByLevel[3].slice(0, level3Needed)
            ];

            // Shuffle the final selection
            return this.shuffleArray(selectedQuestions);

        } catch (error) {
            console.error('Error getting questions with difficulty:', error);
            throw error;
        }
    }

    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
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