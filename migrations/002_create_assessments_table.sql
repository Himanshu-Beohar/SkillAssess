-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    num_questions INT DEFAULT 0,
    time_limit INT DEFAULT 0;
    skill VARCHAR(100),
    sub_skill VARCHAR(100),
    category VARCHAR(100),
    difficulty VARCHAR(50) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    tags JSONB DEFAULT '[]',
    trending BOOLEAN DEFAULT FALSE,
    job_role VARCHAR(150);
);

-- Create index on created_by for faster queries
CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);

-- Insert sample assessments
INSERT INTO assessments (title, description, price, is_premium, created_by) VALUES
('JavaScript Fundamentals', 'Test your knowledge of JavaScript basics, syntax, and core concepts', 0, false, 1),
('SQL Mastery', 'Advanced SQL queries, optimization, and database design concepts', 499, true, 1),
('UI/UX Design Principles', 'Evaluate your understanding of modern UI/UX design practices', 0, false, 1),
('Cloud Architecture', 'Advanced assessment on cloud infrastructure and best practices', 799, true, 1)
ON CONFLICT DO NOTHING;

ALTER TABLE assessments 
  ADD COLUMN num_questions INT DEFAULT 0,
  ADD COLUMN time_limit INT DEFAULT 0;

    ALTER TABLE assessments
-- 🔑 Primary skill (e.g., JavaScript, Python, SQL)
ADD COLUMN skill VARCHAR(100),

-- 📚 Sub-skill or specialization (e.g., React, Pandas, Docker)
ADD COLUMN sub_skill VARCHAR(100),

-- 🗂️ Category of assessment (e.g., Frontend, Backend, Data Science, DevOps)
ADD COLUMN category VARCHAR(100),

-- 📊 Difficulty level (Beginner, Intermediate, Advanced, Expert)
ADD COLUMN difficulty VARCHAR(50) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),

-- 🏷️ Tags for search, recommendations, filters (stored as JSON array)
ADD COLUMN tags JSONB DEFAULT '[]',

-- 📈 Trending flag — whether this assessment is currently trending
ADD COLUMN trending BOOLEAN DEFAULT FALSE,

-- 💼 Primary job roles relevant to this assessment (e.g., "Frontend Developer", "Data Scientist")
ADD COLUMN job_role VARCHAR(150);