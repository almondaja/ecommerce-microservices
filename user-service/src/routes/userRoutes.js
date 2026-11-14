const express = require("express");
const rateLimit = require("express-rate-limit");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Terlalu banyak percobaan. Coba lagi beberapa saat." }
});

router.post("/register", authLimiter, userController.register);
router.post("/login", authLimiter, userController.login);
router.get("/me", authenticateToken, userController.me);
router.get("/:id", authenticateToken, userController.getById);

module.exports = router;
