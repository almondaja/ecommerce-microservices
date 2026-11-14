const paymentService = require("../services/paymentService");

async function createPayment(req, res, next) {
  try {
    const payment = await paymentService.createPayment(req.user, req.body);
    res.status(201).json({ message: "Instruksi pembayaran berhasil dibuat.", data: payment });
  } catch (error) { next(error); }
}

async function getPayment(req, res, next) {
  try {
    const payment = await paymentService.getPayment(req.params.id, req.user);
    res.json({ data: payment });
  } catch (error) { next(error); }
}

async function getPaymentByOrderId(req, res, next) {
  try {
    const payment = await paymentService.getPaymentByOrderId(req.params.orderId, req.user);
    res.json({ data: payment });
  } catch (error) { next(error); }
}

async function confirmPayment(req, res, next) {
  try {
    const payment = await paymentService.confirmPayment(req.params.id);
    res.json({ message: "Pembayaran simulasi berhasil dikonfirmasi.", data: payment });
  } catch (error) { next(error); }
}

module.exports = { createPayment, getPayment, getPaymentByOrderId, confirmPayment };
