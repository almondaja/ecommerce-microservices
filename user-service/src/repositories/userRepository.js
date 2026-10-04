const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function findByEmail(email) {
    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    );

    return result.rows[0];
}

async function findById(id) {
    const result = await pool.query(
        `SELECT id, name, email, role, created_at
         FROM users
         WHERE id = $1`,
        [id]
    );

    return result.rows[0];
}

async function createUser(name, email, passwordHash, role = "buyer") {
    const result = await pool.query(
        `INSERT INTO users
        (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash, role]
    );

    return result.rows[0];
}

module.exports = {
    pool,
    findByEmail,
    findById,
    createUser
};