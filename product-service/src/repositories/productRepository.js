const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function findAll() {
    const result = await pool.query(
        `SELECT *
         FROM products
         ORDER BY id ASC`
    );

    return result.rows;
}

async function findById(id) {
    const result = await pool.query(
        `SELECT *
         FROM products
         WHERE id = $1`,
        [id]
    );

    return result.rows[0];
}

async function createProduct(
    name,
    category,
    price,
    stock,
    description
) {
    const result = await pool.query(
        `INSERT INTO products
        (name, category, price, stock, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
            name,
            category,
            price,
            stock,
            description
        ]
    );

    return result.rows[0];
}

async function updateProduct(
    id,
    name,
    category,
    price,
    stock,
    description
) {
    const result = await pool.query(
        `UPDATE products
         SET
            name = $1,
            category = $2,
            price = $3,
            stock = $4,
            description = $5
         WHERE id = $6
         RETURNING *`,
        [
            name,
            category,
            price,
            stock,
            description,
            id
        ]
    );

    return result.rows[0];
}

async function deleteProduct(id) {
    const result = await pool.query(
        `DELETE FROM products
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0];
}

module.exports = {
    pool,
    findAll,
    findById,
    createProduct,
    updateProduct,
    deleteProduct
};