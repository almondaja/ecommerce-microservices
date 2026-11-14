const { pool } = require("../config/database");

async function createOrder(userId, total, client) {
  const result = await client.query(
    `INSERT INTO orders (user_id, total, status)
     VALUES ($1, $2, 'PENDING_PAYMENT') RETURNING *`,
    [userId, total]
  );
  return result.rows[0];
}

async function createOrderItem(orderId, item, client) {
  const result = await client.query(
    `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [orderId, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]
  );
  return result.rows[0];
}

async function findAll(userId, isAdmin) {
  const result = isAdmin
    ? await pool.query("SELECT * FROM orders ORDER BY id DESC")
    : await pool.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC", [userId]);
  return result.rows;
}

async function findById(id, userId, isAdmin, client = pool) {
  const result = isAdmin
    ? await client.query("SELECT * FROM orders WHERE id = $1", [id])
    : await client.query("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!result.rows[0]) return null;
  const order = result.rows[0];
  const itemResult = await client.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [id]);
  order.items = itemResult.rows;
  return order;
}

async function findByIdInternal(id, client = pool) {
  const result = await client.query("SELECT * FROM orders WHERE id = $1", [id]);
  if (!result.rows[0]) return null;
  const order = result.rows[0];
  const itemResult = await client.query("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [id]);
  order.items = itemResult.rows;
  return order;
}

async function updateStatus(id, status, client = pool) {
  const result = await client.query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
}

module.exports = { pool, createOrder, createOrderItem, findAll, findById, findByIdInternal, updateStatus };
