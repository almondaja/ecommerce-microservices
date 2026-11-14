const orderService = require("../services/orderService");

async function createOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user.id, req.body.items);
    res.status(201).json({ message: "Pesanan berhasil dibuat.", data: order });
  } catch (error) { next(error); }
}

async function getOrders(req, res, next) {
  try {
    const orders = await orderService.getOrders(req.user);
    res.json({ message: "Data pesanan berhasil diambil.", data: orders });
  } catch (error) { next(error); }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    res.json({ data: order });
  } catch (error) { next(error); }
}

async function getOrderInternal(req, res, next) {
  try {
    const order = await orderService.getOrderInternal(req.params.id);
    res.json({ data: order });
  } catch (error) { next(error); }
}

async function updateOrderStatusInternal(req, res, next) {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.json({ message: "Status pesanan berhasil diperbarui.", data: order });
  } catch (error) { next(error); }
}

module.exports = { createOrder, getOrders, getOrderById, getOrderInternal, updateOrderStatusInternal };
