'use strict';

const express = require('express');

// Import the controller functions we just created.
const { getUsers, getUserById } = require('../../controllers/users.controller');

const router = express.Router();

// GET /api/v1/users        → list all users
router.get('/', getUsers);

// GET /api/v1/users/:id    → get one user by id
router.get('/:id', getUserById);

module.exports = router;

