-- Create user_answers table to store individual question responses
CREATE TABLE IF NOT EXISTS user_answers (
    id SERIAL PRIMARY KEY,
    result_id INTEGER REFERENCES results(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id),
    selected_answer INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_answers_result_id ON user_answers(result_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);

-- Insert sample user answers
INSERT INTO user_answers (result_id, question_id, selected_answer, is_correct) VALUES
(1, 1, 0, true),
(1, 2, 0, true),
(1, 3, 0, true),
(1, 4, 3, true),
(1, 5, 0, true)
ON CONFLICT DO NOTHING;