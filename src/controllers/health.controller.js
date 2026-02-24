'use strict';

let APP_VERSION;
try {
  APP_VERSION = require('../../package.json').version || 'unknown';
} catch (_) {
  APP_VERSION = 'unknown';
}

/**
 * GET /health
 * Returns service liveness info with no auth requirement.
 */
function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: 'OK',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: APP_VERSION,
  });
}

module.exports = { getHealth };

