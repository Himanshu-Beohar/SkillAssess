const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, name } = userData;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await query(
      `INSERT INTO users (email, password, name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, name, created_at`,
      [email, hashedPassword, name]
    );
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT id, email, password, name, created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, email, password, name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateProfile(userId, updates) {
    const { name, email } = updates;
    const result = await query(
      `UPDATE users SET name = $1, email = $2 
       WHERE id = $3 
       RETURNING id, email, name, created_at`,
      [name, email, userId]
    );
    return result.rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;