const express = require("express");
const paymentController = require("../controllers/paymentController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/", authenticateToken, paymentController.createPayment);
router.get("/order/:orderId", authenticateToken, paymentController.getPaymentByOrderId);
router.get("/:id", authenticateToken, paymentController.getPayment);
router.post("/:id/confirm", authenticateToken, requireAdmin, paymentController.confirmPayment);

module.exports = router;
