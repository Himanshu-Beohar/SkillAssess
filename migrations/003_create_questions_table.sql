-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on assessment_id for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_assessment_id ON questions(assessment_id);

-- Insert sample questions for JavaScript Fundamentals (assessment_id = 1)
INSERT INTO questions (assessment_id, question_text, options, correct_answer) VALUES
(1, 'What is the correct way to declare a JavaScript variable?', 
 '["var myVar;", "variable myVar;", "v myVar;", "let myVar = var;"]', 0),
(1, 'Which symbol is used for comments in JavaScript?', 
 '["//", "/* */", "#", "--"]', 0),
(1, 'Which method can be used to output data in JavaScript?', 
 '["console.log()", "print()", "output()", "display()"]', 0),
(1, 'Which of the following is not a JavaScript data type?', 
 '["boolean", "string", "number", "element"]', 3),
(1, 'How do you create a function in JavaScript?', 
 '["function myFunction()", "function:myFunction()", "function = myFunction()", "create myFunction()"]', 0)
ON CONFLICT DO NOTHING;

-- Insert sample questions for SQL Mastery (assessment_id = 2)
INSERT INTO questions (assessment_id, question_text, options, correct_answer) VALUES
(2, 'Which SQL statement is used to extract data from a database?', 
 '["EXTRACT", "SELECT", "GET", "QUERY"]', 1),
(2, 'Which SQL clause is used to filter records?', 
 '["FILTER", "WHERE", "QUERY", "CONDITION"]', 1),
(2, 'Which SQL keyword is used to sort the result-set?', 
 '["SORT", "ORDER BY", "ARRANGE", "SORT BY"]', 1)
ON CONFLICT DO NOTHING;
