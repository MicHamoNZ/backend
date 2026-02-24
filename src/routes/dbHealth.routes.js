const express = require('express');
const { getDbHealth } = require('../controllers/dbHealth.controller');

// Create a mini router just for db-health endpoints
const router = express.Router();

// GET /  (will be mounted at /api/db-health in app.js)
router.get('/', getDbHealth);

module.exports = router;