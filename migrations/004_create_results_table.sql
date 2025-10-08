-- ==============================================
-- 🚀 Safe Migration: Create or Update results table
-- ==============================================

-- Create table if it doesn't exist
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

-- ==========================================================
-- 🧩 Add new columns safely (only if they don't exist)
-- ==========================================================
ALTER TABLE results ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2);
ALTER TABLE results ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'pending';
ALTER TABLE results ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;
ALTER TABLE results ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE results ADD COLUMN IF NOT EXISTS feedback TEXT;

-- ==========================================================
-- ⚡ Create or Recreate useful indexes
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_assessment_id ON results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_results_completed_at ON results(completed_at);
CREATE INDEX IF NOT EXISTS idx_results_user_assessment ON results(user_id, assessment_id);

-- ==========================================================
-- 📊 Backfill new columns for existing records
-- ==========================================================

-- 1️⃣ Backfill percentage
UPDATE results
SET percentage = ROUND((score::NUMERIC / NULLIF(total_questions, 0)) * 100, 2)
WHERE percentage IS NULL AND total_questions > 0;

-- 2️⃣ Backfill status (pass/fail threshold 60%)
UPDATE results
SET status = CASE
    WHEN (score::NUMERIC / NULLIF(total_questions, 0)) * 100 >= 60 THEN 'pass'
    ELSE 'fail'
END
WHERE status = 'pending' OR status IS NULL;

-- 3️⃣ Backfill attempt_number (rank attempts per user per assessment)
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, assessment_id 
      ORDER BY completed_at ASC, id ASC
    ) AS attempt_number
  FROM results
)
UPDATE results
SET attempt_number = ranked.attempt_number
FROM ranked
WHERE results.id = ranked.id;

-- 4️⃣ Fallback safety for attempt_number
UPDATE results
SET attempt_number = COALESCE(attempt_number, 1);

-- ==========================================================
-- 🧪 Insert sample results (only if table is empty)
-- ==========================================================
INSERT INTO results (user_id, assessment_id, score, total_questions, time_taken)
SELECT 1, 1, 4, 5, 300
WHERE NOT EXISTS (SELECT 1 FROM results WHERE user_id = 1 AND assessment_id = 1);

INSERT INTO results (user_id, assessment_id, score, total_questions, time_taken)
SELECT 1, 3, 2, 3, 180
WHERE NOT EXISTS (SELECT 1 FROM results WHERE user_id = 1 AND assessment_id = 3);

-- ==============================================
-- ✅ Migration complete — Safe for production
-- ==============================================
