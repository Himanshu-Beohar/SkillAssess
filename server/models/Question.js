const { query } = require('../config/database');

class Question {
  static async create(questionData) {
    const { assessment_id, question_text, options, correct_answer } = questionData;
    
    const result = await query(
      `INSERT INTO questions (assessment_id, question_text, options, correct_answer) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [assessment_id, question_text, JSON.stringify(options), correct_answer]
    );
    
    return result.rows[0];
  }

  static async findByAssessmentId(assessmentId) {
    const result = await query(
      'SELECT * FROM questions WHERE assessment_id = $1 ORDER BY created_at',
      [assessmentId]
    );
    
    // Parse options from JSON string
    const questions = result.rows.map(row => ({
      ...row,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options
    }));
    
    return questions;
  }

  // static async findById(id) {
  //   const result = await query(
  //     'SELECT * FROM questions WHERE id = $1',
  //     [id]
  //   );
    
  //   if (result.rows.length === 0) return null;
    
  //   const question = result.rows[0];
  //   question.options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    
  //   return question;
  // }
  static async findByIds(questionIds) {
    if (!questionIds || questionIds.length === 0) return [];
    
    try {
        const placeholders = questionIds.map((_, index) => `$${index + 1}`).join(',');
        const result = await query(
            `SELECT * FROM questions WHERE id IN (${placeholders})`,
            questionIds
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error finding questions by IDs:', error);
        throw error;
    }
  }

  static async update(id, updates) {
    const { question_text, options, correct_answer } = updates;
    
    const result = await query(
      `UPDATE questions 
       SET question_text = $1, options = $2, correct_answer = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [question_text, JSON.stringify(options), correct_answer, id]
    );
    
    if (result.rows.length === 0) return null;
    
    const question = result.rows[0];
    question.options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    
    return question;
  }

  static async delete(id) {
    await query('DELETE FROM questions WHERE id = $1', [id]);
    return true;
  }

  static async validateAnswer(questionId, selectedAnswer) {
    const question = await this.findById(questionId);
    if (!question) throw new Error('Question not found');
    
    return {
      is_correct: question.correct_answer === selectedAnswer,
      correct_answer: question.correct_answer
    };
  }
}

module.exports = Question;