const axios = require("axios");
const crypto = require("crypto");
const paymentRepository = require("../repositories/paymentRepository");

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function getOrder(orderId) {
  const baseUrl = (process.env.ORDER_SERVICE_URL || "http://localhost:3003").replace(/\/$/, "");
  try {
    const response = await axios.get(`${baseUrl}/orders/internal/${orderId}`, {
      headers: { "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN },
      timeout: 7000
    });
    return response.data.data;
  } catch (error) {
    if (error.response) throw httpError(error.response.data?.message || "Data pesanan tidak dapat diambil.", error.response.status);
    throw httpError("Order Service tidak dapat dihubungi.", 503);
  }
}

async function createPayment(user, data) {
  const orderId = Number(data.order_id);
  const allowedMethods = ["BANK_TRANSFER", "E_WALLET", "CREDIT_CARD"];
  const paymentMethod = String(data.payment_method || "").toUpperCase();
  if (!Number.isSafeInteger(orderId) || orderId < 1) throw httpError("order_id tidak valid.");
  if (!allowedMethods.includes(paymentMethod)) throw httpError("payment_method harus BANK_TRANSFER, E_WALLET, atau CREDIT_CARD.");

  const order = await getOrder(orderId);
  if (Number(order.user_id) !== Number(user.id) && user.role !== "admin") {
    throw httpError("Pesanan bukan milik akun ini.", 403);
  }
  if (order.status !== "PENDING_PAYMENT") throw httpError("Pesanan tidak sedang menunggu pembayaran.", 409);

  const existing = await paymentRepository.findByOrderId(orderId);
  if (existing) {
    if (existing.status === "PENDING") return existing;
    throw httpError("Pembayaran untuk pesanan ini sudah diproses.", 409);
  }

  const payment = {
    reference: `PAY-${crypto.randomUUID()}`,
    order_id: orderId,
    user_id: Number(order.user_id),
    amount: Number(order.total).toFixed(2),
    payment_method: paymentMethod
  };

  try {
    return await paymentRepository.create(payment);
  } catch (error) {
    if (error.code === "23505") {
      const duplicate = await paymentRepository.findByOrderId(orderId);
      if (duplicate) return duplicate;
    }
    throw error;
  }
}

async function getPayment(id, user) {
  const paymentId = Number(id);
  if (!Number.isSafeInteger(paymentId) || paymentId < 1) throw httpError("ID pembayaran tidak valid.");
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) throw httpError("Pembayaran tidak ditemukan.", 404);
  if (user.role !== "admin" && Number(payment.user_id) !== Number(user.id)) throw httpError("Pembayaran bukan milik akun ini.", 403);
  return payment;
}

async function getPaymentByOrderId(id, user) {
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId < 1) throw httpError("ID pesanan tidak valid.");
  const payment = await paymentRepository.findByOrderId(orderId);
  if (!payment) throw httpError("Pembayaran tidak ditemukan.", 404);
  if (user.role !== "admin" && Number(payment.user_id) !== Number(user.id)) throw httpError("Pembayaran bukan milik akun ini.", 403);
  return payment;
}

async function confirmPayment(id) {
  const paymentId = Number(id);
  if (!Number.isSafeInteger(paymentId) || paymentId < 1) throw httpError("ID pembayaran tidak valid.");
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) throw httpError("Pembayaran tidak ditemukan.", 404);
  if (payment.status !== "PENDING") throw httpError("Pembayaran bukan berstatus PENDING.", 409);

  const baseUrl = (process.env.ORDER_SERVICE_URL || "http://localhost:3003").replace(/\/$/, "");
  try {
    await axios.put(
      `${baseUrl}/orders/internal/${payment.order_id}/status`,
      { status: "PAID" },
      { headers: { "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN }, timeout: 7000 }
    );
  } catch (error) {
    if (error.response) throw httpError(error.response.data?.message || "Status pesanan gagal diperbarui.", error.response.status);
    throw httpError("Order Service tidak dapat dihubungi.", 503);
  }

  return paymentRepository.updateStatus(paymentId, "PAID");
}

module.exports = { createPayment, getPayment, getPaymentByOrderId, confirmPayment };
