const express = require("express");
const orderController = require("../controllers/orderController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");
const { internalAuth } = require("../middleware/internalAuth");

const router = express.Router();

// Endpoint internal dipakai Payment Service; tidak diteruskan oleh frontend secara langsung.
router.get("/internal/:id", internalAuth, orderController.getOrderInternal);
router.put("/internal/:id/status", internalAuth, orderController.updateOrderStatusInternal);

router.post("/", authenticateToken, orderController.createOrder);
router.get("/", authenticateToken, orderController.getOrders);
router.get("/:id", authenticateToken, orderController.getOrderById);
router.put("/:id/status", authenticateToken, requireAdmin, orderController.updateOrderStatusInternal);

module.exports = router;
