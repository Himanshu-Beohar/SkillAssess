-- Create results table
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    assessment_id INTEGER REFERENCES assessments(id),
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_assessment_id ON results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_results_completed_at ON results(completed_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_results_user_assessment ON results(user_id, assessment_id);

-- Insert sample results
INSERT INTO results (user_id, assessment_id, score, total_questions, time_taken) VALUES
(1, 1, 4, 5, 300),
(1, 3, 2, 3, 180)
ON CONFLICT DO NOTHING;