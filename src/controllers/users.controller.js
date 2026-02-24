'use strict';

// ---------------------------------------------------------------------------
// In-memory "database" – just a plain array of user objects.
// Replace this with a real DB query later when you add persistence.
// ---------------------------------------------------------------------------
const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob Smith',    email: 'bob@example.com',   role: 'editor' },
  { id: 3, name: 'Carol White',  email: 'carol@example.com', role: 'viewer' },
];

// ---------------------------------------------------------------------------
// GET /api/v1/users
// Returns all users.
// ---------------------------------------------------------------------------
function getUsers(req, res) {
  return res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
}

// ---------------------------------------------------------------------------
// GET /api/v1/users/:id
// Returns a single user by numeric id, or 404 if not found.
// ---------------------------------------------------------------------------
function getUserById(req, res) {
  // Convert the URL param (always a string) to a number so we can compare.
  const id = Number(req.params.id);

  // Array.find returns the first match, or undefined if nothing matches.
  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
}

module.exports = { getUsers, getUserById };

