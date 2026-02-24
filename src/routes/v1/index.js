'use strict';

const express = require('express');
const statusRouter = require('./status.routes');

const router = express.Router();

// Mount all v1 resource routes
router.use('/status', statusRouter);

module.exports = router;

