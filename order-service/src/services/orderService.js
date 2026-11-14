const axios = require("axios");
const orderRepository = require("../repositories/orderRepository");

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError("Keranjang pesanan tidak boleh kosong.");
  }
  const combined = new Map();
  for (const item of items) {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);
    if (!Number.isSafeInteger(productId) || productId < 1) {
      throw httpError("product_id harus berupa bilangan bulat positif.");
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw httpError("quantity harus berupa bilangan bulat positif.");
    }
    combined.set(productId, (combined.get(productId) || 0) + quantity);
  }
  return [...combined.entries()].map(([product_id, quantity]) => ({ product_id, quantity }));
}

async function reserveProduct(productId, quantity) {
  const baseUrl = (process.env.PRODUCT_SERVICE_URL || "http://localhost:3002").replace(/\/$/, "");
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (!token) throw httpError("INTERNAL_SERVICE_TOKEN belum dikonfigurasi.", 500);
  try {
    const response = await axios.post(
      `${baseUrl}/products/internal/${productId}/reserve`,
      { quantity },
      { headers: { "x-internal-token": token }, timeout: 7000 }
    );
    return response.data.data;
  } catch (error) {
    if (error.response) {
      throw httpError(error.response.data?.message || "Reservasi stok produk gagal.", error.response.status);
    }
    throw httpError("Product Service tidak dapat dihubungi. Periksa PRODUCT_SERVICE_URL dan pastikan Product Service berjalan.", 503);
  }
}

async function releaseProduct(productId, quantity) {
  const baseUrl = (process.env.PRODUCT_SERVICE_URL || "http://localhost:3002").replace(/\/$/, "");
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  try {
    await axios.post(
      `${baseUrl}/products/internal/${productId}/release`,
      { quantity },
      { headers: { "x-internal-token": token }, timeout: 7000 }
    );
  } catch (error) {
    console.error(`Gagal mengembalikan stok produk ${productId}:`, error.message);
  }
}

async function createOrder(userId, rawItems) {
  const parsedUserId = Number(userId);
  if (!Number.isSafeInteger(parsedUserId) || parsedUserId < 1) {
    throw httpError("Identitas pengguna tidak valid.", 401);
  }

  const items = normalizeItems(rawItems);
  const reservations = [];
  const processedItems = [];
  let client;
  let committed = false;

  try {
    for (const item of items) {
      const product = await reserveProduct(item.product_id, item.quantity);
      reservations.push({ product_id: item.product_id, quantity: item.quantity });
      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) throw httpError("Harga produk dari Product Service tidak valid.", 502);
      const priceCents = Math.round(price * 100);
      const subtotal = ((priceCents * item.quantity) / 100).toFixed(2);
      processedItems.push({
        product_id: Number(product.id),
        product_name: product.name,
        price: (priceCents / 100).toFixed(2),
        quantity: item.quantity,
        subtotal
      });
    }

    const totalCents = processedItems.reduce((sum, item) => sum + Math.round(Number(item.subtotal) * 100), 0);
    const total = (totalCents / 100).toFixed(2);

    client = await orderRepository.pool.connect();
    await client.query("BEGIN");
    const order = await orderRepository.createOrder(parsedUserId, total, client);
    for (const item of processedItems) {
      await orderRepository.createOrderItem(order.id, item, client);
    }
    await client.query("COMMIT");
    committed = true;

    return await orderRepository.findById(order.id, parsedUserId, false);
  } catch (error) {
    if (client && !committed) {
      try { await client.query("ROLLBACK"); } catch (rollbackError) {
        console.error("Order transaction rollback failed:", rollbackError.message);
      }
    }
    if (!committed) {
      await Promise.allSettled(reservations.map((item) => releaseProduct(item.product_id, item.quantity)));
    }
    throw error;
  } finally {
    if (client) client.release();
  }
}

async function getOrders(user) {
  return orderRepository.findAll(Number(user.id), user.role === "admin");
}

async function getOrderById(id, user) {
  const parsedId = Number(id);
  if (!Number.isSafeInteger(parsedId) || parsedId < 1) throw httpError("ID pesanan tidak valid.");
  const order = await orderRepository.findById(parsedId, Number(user.id), user.role === "admin");
  if (!order) throw httpError("Pesanan tidak ditemukan.", 404);
  return order;
}

async function getOrderInternal(id) {
  const parsedId = Number(id);
  if (!Number.isSafeInteger(parsedId) || parsedId < 1) throw httpError("ID pesanan tidak valid.");
  const order = await orderRepository.findByIdInternal(parsedId);
  if (!order) throw httpError("Pesanan tidak ditemukan.", 404);
  return order;
}

async function updateOrderStatus(id, status) {
  const transitions = {
    PENDING_PAYMENT: ["PAID", "CANCELLED"],
    PAID: ["PROCESSING"],
    PROCESSING: ["SHIPPED"],
    SHIPPED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: []
  };
  if (!Object.hasOwn(transitions, status)) throw httpError("Status pesanan tidak valid.");

  const client = await orderRepository.pool.connect();
  let order;
  try {
    await client.query("BEGIN");
    const current = await orderRepository.findByIdInternal(id, client);
    if (!current) throw httpError("Pesanan tidak ditemukan.", 404);
    if (!transitions[current.status].includes(status)) {
      throw httpError(`Perubahan status dari ${current.status} ke ${status} tidak diizinkan.`, 409);
    }
    order = await orderRepository.updateStatus(id, status, client);
    await client.query("COMMIT");
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_rollbackError) {}
    throw error;
  } finally {
    client.release();
  }

  if (status === "CANCELLED" && order) {
    const cancelledOrder = await orderRepository.findByIdInternal(id);
    await Promise.allSettled((cancelledOrder.items || []).map((item) => releaseProduct(item.product_id, item.quantity)));
  }
  return order;
}

module.exports = { createOrder, getOrders, getOrderById, getOrderInternal, updateOrderStatus };
