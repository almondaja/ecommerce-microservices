require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const paymentRoutes = require("./routes/paymentRoutes");
const { pool } = require("./config/database");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { startOrderCreatedConsumer, closeOrderCreatedConsumer } = require("./messaging/orderCreatedConsumer");

const app = express();
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ service: "payment-service", status: "online", database: "connected" });
  } catch (error) {
    console.error("Payment Service health check failed:", error.message);
    res.status(503).json({ service: "payment-service", status: "offline", database: "disconnected" });
  }
});

app.use("/payments", paymentRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3004);
const server = app.listen(PORT, process.env.HOST || "0.0.0.0", () => console.log(`Payment Service berjalan pada port ${PORT}`));
startOrderCreatedConsumer().catch((error) => console.error("RabbitMQ consumer gagal dimulai:", error.message));

async function shutdown() {
  server.close(async () => { await closeOrderCreatedConsumer(); await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = app;
