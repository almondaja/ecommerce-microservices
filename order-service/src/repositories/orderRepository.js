const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function createOrder(userId, total, status, client) {
    const db = client || pool;

    const result = await db.query(
        `INSERT INTO orders
        (user_id, total, status)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [userId, total, status]
    );

    return result.rows[0];
}

async function createOrderItem(
    orderId,
    productId,
    productName,
    price,
    quantity,
    subtotal,
    client
) {
    const db = client || pool;

    const result = await db.query(
        `INSERT INTO order_items
        (order_id, product_id, product_name, price, quantity, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
            orderId,
            productId,
            productName,
            price,
            quantity,
            subtotal
        ]
    );

    return result.rows[0];
}

async function findAll() {
    const result = await pool.query(
        `SELECT *
         FROM orders
         ORDER BY id DESC`
    );

    return result.rows;
}

async function findById(id) {
    const orderResult = await pool.query(
        `SELECT *
         FROM orders
         WHERE id = $1`,
        [id]
    );

    if (orderResult.rows.length === 0) {
        return null;
    }

    const order = orderResult.rows[0];

    const itemResult = await pool.query(
        `SELECT *
         FROM order_items
         WHERE order_id = $1
         ORDER BY id ASC`,
        [id]
    );

    order.items = itemResult.rows;

    return order;
}

async function updateStatus(id, status) {
    const result = await pool.query(
        `UPDATE orders
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
    );

    return result.rows[0];
}

module.exports = {
    pool,
    createOrder,
    createOrderItem,
    findAll,
    findById,
    updateStatus
};