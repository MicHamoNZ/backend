'use strict';

const express = require('express');
const { getStatus } = require('../../controllers/status.controller');

const router = express.Router();

// GET /api/v1/status
router.get('/', getStatus);

module.exports = router;

