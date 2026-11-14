const { pool } = require("../config/database");

async function findByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function createUser(name, email, passwordHash) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'buyer')
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

module.exports = { findByEmail, findById, createUser };
