const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
    return;
  }
  console.log('Database connected successfully');
  release();
});

// Query function
const query = (text, params) => {
  return pool.query(text, params);
};

// Transaction function
const transaction = async (queries) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const q of queries) {
      results.push(await client.query(q.text, q.values));
    }
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  transaction,
  pool
};