require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const axios = require("axios");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const services = {
  user: process.env.USER_SERVICE_URL || "http://localhost:3001",
  product: process.env.PRODUCT_SERVICE_URL || "http://localhost:3002",
  order: process.env.ORDER_SERVICE_URL || "http://localhost:3003",
  payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:3004"
};
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));

// Liveness probe: confirms the gateway process is accepting HTTP requests.
// Keep this independent from database readiness so Render does not restart a
// healthy process while Neon is waking from its free-tier idle state.
app.get("/health/live", (_req, res) => {
  res.status(200).json({ service: "api-gateway", status: "alive" });
});

// Readiness/dependency probe: checks all backend services and their databases.
app.get("/health", async (req, res) => {
  const entries = await Promise.all(Object.entries(services).map(async ([name, baseUrl]) => {
    try {
      await axios.get(`${baseUrl}/health`, { timeout: 2500 });
      return [name, "online"];
    } catch (_error) {
      return [name, "offline"];
    }
  }));
  const serviceStatus = Object.fromEntries(entries);
  const healthy = Object.values(serviceStatus).every((status) => status === "online");
  res.status(healthy ? 200 : 503).json({
    service: "api-gateway",
    status: healthy ? "online" : "degraded",
    services: serviceStatus
  });
});

function proxy(pathPrefix, target) {
  return createProxyMiddleware({
    pathFilter: (path) => path === pathPrefix || path.startsWith(`${pathPrefix}/`) || path.startsWith(`${pathPrefix}?`),
    target,
    changeOrigin: true,
    proxyTimeout: 10000,
    timeout: 12000,
    on: {
      error(error, req, res) {
        console.error(`Gateway proxy error (${pathPrefix}):`, error.message);
        if (!res.headersSent) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: `Service ${pathPrefix.slice(1)} sedang tidak tersedia.` }));
        }
      }
    }
  });
}

app.use(proxy("/users", services.user));
app.use(proxy("/products", services.product));
app.use(proxy("/orders", services.order));
app.use(proxy("/payments", services.payment));

app.use((req, res) => res.status(404).json({ message: "Endpoint tidak ditemukan pada API Gateway." }));

app.listen(PORT, process.env.HOST || "0.0.0.0", () => console.log(`API Gateway berjalan pada port ${PORT}`));

module.exports = app;
