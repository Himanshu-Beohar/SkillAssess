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

  // static async findById(id) {
  //   const result = await query(
  //     'SELECT id, email, password, name, created_at FROM users WHERE id = $1',
  //     [id]
  //   );
  //   return result.rows[0];
  // }

  static async findById(id) {
    const result = await query(`
      SELECT
        id, 
        name, 
        email, 
        gender, 
        phone,
        -- Use DATE() function to remove time component completely
        to_char(DATE(dob), 'YYYY-MM-DD') AS dob,
        city, 
        country, 
        qualification, 
        college, 
        occupation, 
        experience, 
        skills, 
        goal,
        created_at, 
        updated_at
      FROM users
      WHERE id = $1
    `, [id]);
    
    console.log("📊 [DB QUERY] DOB returned:", result.rows[0]?.dob);
    return result.rows[0];
  }

  // static async updateProfile(userId, updates) {
  //   const { name, email } = updates;
  //   const result = await query(
  //     `UPDATE users SET name = $1, email = $2 
  //      WHERE id = $3 
  //      RETURNING id, email, name, created_at`,
  //     [name, email, userId]
  //   );
  //   return result.rows[0];
  // }

  // models/User.js
  static async updateProfile(userId, updates) {
    const {
      name,
      gender,
      phone,
      dob,
      city,
      country,
      qualification,
      college,
      occupation,
      experience,
      skills,
      goal
    } = updates;

    console.log("📥 [UPDATE] Received DOB:", dob);
    let dobDate = null;
    if (dob) {
      // Parse the date in UTC to avoid timezone shifts
      const [year, month, day] = dob.split('-').map(Number);
      dobDate = new Date(Date.UTC(year, month - 1, day));
      
      // Format for PostgreSQL as YYYY-MM-DD
      dobDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    console.log("📤 [UPDATE] Storing DOB as:", dobDate);


    const result = await query(
      `
      UPDATE users 
      SET 
        name = $1,
        gender = $2,
        phone = $3,
        dob = $4::DATE,  -- Explicitly cast to DATE type
        city = $5,
        country = $6,
        qualification = $7,
        college = $8,
        occupation = $9,
        experience = $10,
        skills = $11,
        goal = $12,
        updated_at = NOW()
      WHERE id = $13
      RETURNING 
        id,
        name,
        email,
        gender,
        phone,
        to_char(dob, 'YYYY-MM-DD') AS dob,  -- Always return as YYYY-MM-DD
        city,
        country,
        qualification,
        college,
        occupation,
        experience,
        skills,
        goal,
        created_at,
        updated_at
      `,
      [
        name,
        gender,
        phone,
        dobDate,  // This should now be in YYYY-MM-DD format
        city,
        country,
        qualification,
        college,
        occupation,
        experience,
        JSON.stringify(skills || []), // ✅ safely convert skills to JSON
        goal,
        userId
      ]
    );

    console.log("✅ [UPDATE] Stored DOB:", result.rows[0]?.dob);
    return result.rows[0];
  }



  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;