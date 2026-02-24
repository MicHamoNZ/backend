'use strict';

// Returns a simple status response for API v1
function getStatus(req, res) {
  res.status(200).json({
    success: true,
    message: 'API v1 status OK',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getStatus };

