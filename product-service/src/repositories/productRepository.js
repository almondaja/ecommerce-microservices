const { pool } = require("../config/database");

async function findAll({ search, category, limit, offset }) {
  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }
  if (category) {
    values.push(category);
    conditions.push(`category ILIKE $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM products ${whereClause}`,
    values
  );

  values.push(limit, offset);
  const result = await pool.query(
    `SELECT * FROM products ${whereClause}
     ORDER BY id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return { items: result.rows, total: countResult.rows[0].total };
}

async function findById(id, client = pool) {
  const result = await client.query("SELECT * FROM products WHERE id = $1", [id]);
  return result.rows[0] || null;
}

async function create(data) {
  const result = await pool.query(
    `INSERT INTO products (name, category, price, stock, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.name, data.category, data.price, data.stock, data.description]
  );
  return result.rows[0];
}

async function update(id, data) {
  const result = await pool.query(
    `UPDATE products
     SET name = $1, category = $2, price = $3, stock = $4, description = $5
     WHERE id = $6 RETURNING *`,
    [data.name, data.category, data.price, data.stock, data.description, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
  return result.rows[0] || null;
}

async function reserveStock(id, quantity) {
  const result = await pool.query(
    `UPDATE products
     SET stock = stock - $1
     WHERE id = $2 AND stock >= $1
     RETURNING *`,
    [quantity, id]
  );
  return result.rows[0] || null;
}

async function releaseStock(id, quantity) {
  const result = await pool.query(
    `UPDATE products
     SET stock = stock + $1
     WHERE id = $2
     RETURNING *`,
    [quantity, id]
  );
  return result.rows[0] || null;
}

module.exports = { findAll, findById, create, update, remove, reserveStock, releaseStock };
