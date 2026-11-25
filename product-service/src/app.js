require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const productRoutes = require("./routes/productRoutes");
const { pool } = require("./config/database");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

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
    res.json({ service: "product-service", status: "online", database: "connected" });
  } catch (error) {
    console.error("Product Service health check failed:", error.message);
    res.status(503).json({ service: "product-service", status: "offline", database: "disconnected" });
  }
});

app.use("/products", productRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3002);
const server = app.listen(PORT, process.env.HOST || "0.0.0.0", () => console.log(`Product Service berjalan pada port ${PORT}`));

async function shutdown() {
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = app;
