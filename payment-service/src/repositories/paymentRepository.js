const { pool } = require("../config/database");

async function create(payment) {
  const result = await pool.query(
    `INSERT INTO payments (reference, order_id, user_id, amount, payment_method, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
    [payment.reference, payment.order_id, payment.user_id, payment.amount, payment.payment_method]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function findByOrderId(orderId) {
  const result = await pool.query("SELECT * FROM payments WHERE order_id = $1", [orderId]);
  return result.rows[0] || null;
}

async function updateStatus(id, status) {
  const result = await pool.query(
    "UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0] || null;
}

module.exports = { create, findById, findByOrderId, updateStatus };
