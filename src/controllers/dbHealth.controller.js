// Pull in testDbConnection from our db config
const { testDbConnection } = require('../config/db');

/**
 * GET /api/db-health
 * Checks whether the application can reach the PostgreSQL database.
 */
async function getDbHealth(req, res) {
  try {
    // Try to run SELECT NOW() against the database
    const row = await testDbConnection();

    // If we get here, the connection worked
    return res.status(200).json({
      success: true,
      message: 'Database connection OK',
      timestamp: new Date().toISOString(), // current server time
      dbTime: row.now,                     // timestamp returned by PostgreSQL
    });
  } catch (err) {
    // Something went wrong — log it and tell the client
    console.error('❌ Database health check failed:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
}

module.exports = { getDbHealth };