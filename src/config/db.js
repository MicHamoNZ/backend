// Import the Pool class from the 'pg' (node-postgres) package
const { Pool } = require('pg');

// Create a new connection pool using environment variables from .env
// A pool manages multiple database connections efficiently
const pool = new Pool({
  host: process.env.DB_HOST,         // e.g. localhost
  port: process.env.DB_PORT,         // e.g. 5432
  database: process.env.DB_NAME,     // e.g. wb-project-2
  user: process.env.DB_USER,         // e.g. postgres
  password: process.env.DB_PASSWORD, // your db password
});

// Optional: log a message whenever the pool makes a new connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL pool: new client connected');
});

// Temporarily log which server we are connecting to
console.log('🔌 Connecting to PostgreSQL at:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

// Optional: log pool errors so they don't crash the app silently
pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

/**
 * Runs a simple "SELECT NOW()" query to check if the database is reachable.
 * Returns the result row so callers can display the DB server time.
 */
async function testDbConnection() {
  // 'pool.query' borrows a client from the pool, runs the query, then returns it
  const result = await pool.query('SELECT NOW()');
  // result.rows is an array; we return the first (and only) row
  return result.rows[0];
}

// Export both so other files can use them
module.exports = { pool, testDbConnection };