'use strict';

const express = require('express');
const statusRouter = require('./status.routes');
const usersRouter  = require('./users.routes'); // ← new

const router = express.Router();

// Mount all v1 resource routes
router.use('/status', statusRouter);
router.use('/users',  usersRouter);  // ← new

module.exports = router;

