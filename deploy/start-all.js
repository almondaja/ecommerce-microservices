const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const required = ["JWT_SECRET", "INTERNAL_SERVICE_TOKEN", "CORS_ORIGIN", "NEON_DB_HOST", "NEON_DB_USER", "NEON_DB_PASSWORD", "AMQP_URL"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Environment variable wajib belum diatur: ${missing.join(", ")}`);
  process.exit(1);
}

const shared = {
  ...process.env,
  NODE_ENV: "production",
  JWT_SECRET: process.env.JWT_SECRET,
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN,
  DB_HOST: process.env.NEON_DB_HOST,
  DB_PORT: process.env.NEON_DB_PORT || "5432",
  DB_USER: process.env.NEON_DB_USER,
  DB_PASSWORD: process.env.NEON_DB_PASSWORD,
  DB_SSL: "true",
  DB_POOL_MAX: process.env.DB_POOL_MAX || "3",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*"
};

const amqpUrl = process.env.AMQP_URL || "";

const services = [
  {
    name: "user-service",
    folder: "user-service",
    env: {
      ...shared,
      PORT: "3001",
      HOST: "127.0.0.1",
      DB_NAME: process.env.USER_DB_NAME || "ecommerce_user_db"
    }
  },
  {
    name: "product-service",
    folder: "product-service",
    env: {
      ...shared,
      PORT: "3002",
      HOST: "127.0.0.1",
      DB_NAME: process.env.PRODUCT_DB_NAME || "ecommerce_product_db"
    }
  },
  {
    name: "order-service",
    folder: "order-service",
    env: {
      ...shared,
      PORT: "3003",
      HOST: "127.0.0.1",
      DB_NAME: process.env.ORDER_DB_NAME || "ecommerce_order_db",
      PRODUCT_SERVICE_URL: "http://127.0.0.1:3002",
      AMQP_URL: amqpUrl
    }
  },
  {
    name: "payment-service",
    folder: "payment-service",
    env: {
      ...shared,
      PORT: "3004",
      HOST: "127.0.0.1",
      DB_NAME: process.env.PAYMENT_DB_NAME || "ecommerce_payment_db",
      ORDER_SERVICE_URL: "http://127.0.0.1:3003",
      AMQP_URL: amqpUrl
    }
  },
  {
    name: "api-gateway",
    folder: "api-gateway",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: process.env.PORT || "10000",
      HOST: "0.0.0.0",
      USER_SERVICE_URL: "http://127.0.0.1:3001",
      PRODUCT_SERVICE_URL: "http://127.0.0.1:3002",
      ORDER_SERVICE_URL: "http://127.0.0.1:3003",
      PAYMENT_SERVICE_URL: "http://127.0.0.1:3004",
      CORS_ORIGIN: process.env.CORS_ORIGIN || "*"
    }
  }
];

const children = [];
let stopping = false;

function stopAll(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  const forceExit = setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGKILL");
    }
    process.exit(process.exitCode || 1);
  }, 10000);
  forceExit.unref();
}

process.on("SIGTERM", () => stopAll("SIGTERM"));
process.on("SIGINT", () => stopAll("SIGINT"));

for (const service of services) {
  const child = spawn(process.execPath, ["src/app.js"], {
    cwd: path.join(projectRoot, service.folder),
    env: service.env,
    stdio: "inherit"
  });

  children.push(child);
  child.on("error", (error) => {
    console.error(`${service.name} gagal dijalankan:`, error.message);
    process.exitCode = 1;
    stopAll();
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(`${service.name} berhenti tidak terduga (code=${code}, signal=${signal}).`);
      process.exitCode = code || 1;
      stopAll();
    }
  });
}

console.log("Seluruh proses microservices dan API Gateway sedang dijalankan.");
