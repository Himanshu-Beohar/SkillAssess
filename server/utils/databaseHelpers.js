const { query } = require('../config/database');

const databaseHelpers = {
  // Check if database table exists
  async tableExists(tableName) {
    try {
      const result = await query(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name = $1
        )`,
        [tableName]
      );
      return result.rows[0].exists;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  },

  // Initialize database tables
  async initializeDatabase() {
    try {
      console.log('Initializing database tables...');

      // Create users table
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create assessments table
      await query(`
        CREATE TABLE IF NOT EXISTS assessments (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) DEFAULT 0,
          is_premium BOOLEAN DEFAULT FALSE,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create questions table
      await query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          options JSONB NOT NULL,
          correct_answer INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create results table
      await query(`
        CREATE TABLE IF NOT EXISTS results (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          assessment_id INTEGER REFERENCES assessments(id),
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          time_taken INTEGER DEFAULT 0,
          completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create payments table
      await query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          assessment_id INTEGER REFERENCES assessments(id),
          amount DECIMAL(10, 2) NOT NULL,
          razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
          razorpay_payment_id VARCHAR(255),
          razorpay_signature VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);
        CREATE INDEX IF NOT EXISTS idx_questions_assessment_id ON questions(assessment_id);
        CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
        CREATE INDEX IF NOT EXISTS idx_results_assessment_id ON results(assessment_id);
        CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
        CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(razorpay_order_id);
      `);

      console.log('Database tables initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  },

  // Seed initial data
  async seedInitialData() {
    try {
      console.log('Seeding initial data...');

      // Check if we already have data
      const userCount = await query('SELECT COUNT(*) FROM users');
      if (parseInt(userCount.rows[0].count) > 0) {
        console.log('Database already has data, skipping seeding');
        return;
      }

      // Create sample assessments
      const assessmentResult = await query(`
        INSERT INTO assessments (title, description, price, is_premium, created_by)
        VALUES 
          ('JavaScript Fundamentals', 'Test your knowledge of JavaScript basics', 0, false, 1),
          ('Advanced React Patterns', 'Advanced React concepts and patterns', 499, true, 1),
          ('Node.js Backend Development', 'Server-side JavaScript with Node.js', 299, true, 1),
          ('CSS & HTML Basics', 'Fundamental web development skills', 0, false, 1)
        RETURNING id
      `);

      // Create sample questions for JavaScript Fundamentals
      const jsAssessmentId = assessmentResult.rows[0].id;
      await query(`
        INSERT INTO questions (assessment_id, question_text, options, correct_answer)
        VALUES 
          ($1, 'What is the correct way to declare a JavaScript variable?', 
           '["var myVar;", "variable myVar;", "v myVar;", "let myVar = var;"]', 0),
          ($1, 'Which symbol is used for comments in JavaScript?', 
           '["//", "/* */", "#", "--"]', 0),
          ($1, 'Which method can be used to output data in JavaScript?', 
           '["console.log()", "print()", "output()", "display()"]', 0)
      `, [jsAssessmentId]);

      console.log('Initial data seeded successfully');
    } catch (error) {
      console.error('Error seeding initial data:', error);
    }
  },

  // Database health check
  async healthCheck() {
    try {
      await query('SELECT 1');
      return { status: 'healthy', message: 'Database connection successful' };
    } catch (error) {
      return { status: 'unhealthy', message: 'Database connection failed', error: error.message };
    }
  }
};

module.exports = databaseHelpers;