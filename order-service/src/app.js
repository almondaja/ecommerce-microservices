require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const orderRoutes = require("./routes/orderRoutes");
const { pool } = require("./config/database");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ service: "order-service", status: "online", database: "connected" });
  } catch (error) {
    console.error("Order Service health check failed:", error.message);
    res.status(503).json({ service: "order-service", status: "offline", database: "disconnected" });
  }
});

app.use("/orders", orderRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3003);
const server = app.listen(PORT, () => console.log(`Order Service berjalan pada port ${PORT}`));

async function shutdown() {
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = app;
