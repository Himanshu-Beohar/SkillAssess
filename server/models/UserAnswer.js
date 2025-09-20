const { query } = require('../config/database');

class UserAnswer {
    static async create(answerData) {
        const { result_id, question_id, selected_answer, is_correct } = answerData;
        
        const result = await query(
            `INSERT INTO user_answers (result_id, question_id, selected_answer, is_correct) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [result_id, question_id, selected_answer, is_correct]
        );
        
        return result.rows[0];
    }

    static async findByResultId(resultId) {
        const result = await query(
            `SELECT * FROM user_answers WHERE result_id = $1`,
            [resultId]
        );
        
        return result.rows;
    }
}

module.exports = UserAnswer;