const express = require("express");
const productController = require("../controllers/productController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");
const { internalAuth } = require("../middleware/internalAuth");

const router = express.Router();

// Endpoint internal diproteksi token service-to-service dan tidak boleh dipanggil frontend.
router.post("/internal/:id/reserve", internalAuth, productController.reserveStock);
router.post("/internal/:id/release", internalAuth, productController.releaseStock);

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", authenticateToken, requireAdmin, productController.createProduct);
router.put("/:id", authenticateToken, requireAdmin, productController.updateProduct);
router.delete("/:id", authenticateToken, requireAdmin, productController.deleteProduct);

module.exports = router;
