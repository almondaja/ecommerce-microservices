const amqp = require("amqplib");
const { pool } = require("../config/database");

const EXCHANGE = "ecommerce.events";
const QUEUE = "payment.order-created";

let connection = null;
let channel = null;
let retryTimer = null;
let starting = false;
let stopping = false;

async function ensureEventTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_order_events (
      event_id UUID PRIMARY KEY,
      order_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
      event_type VARCHAR(50) NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payment_order_events_order_id
    ON payment_order_events (order_id)
  `);
}

function scheduleReconnect() {
  if (stopping || retryTimer || !process.env.AMQP_URL) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    startOrderCreatedConsumer();
  }, 5000);
  retryTimer.unref();
}

async function startOrderCreatedConsumer() {
  if (!process.env.AMQP_URL) {
    console.warn("AMQP_URL belum diatur; consumer event order.created dinonaktifkan.");
    return;
  }
  if (stopping || starting || channel) return;

  starting = true;
  try {
    await ensureEventTable();
    connection = await amqp.connect(process.env.AMQP_URL, { heartbeat: 30 });
    connection.on("error", (error) => console.error("RabbitMQ consumer connection error:", error.message));
    connection.on("close", () => {
      connection = null;
      channel = null;
      scheduleReconnect();
    });

    channel = await connection.createChannel();
    channel.on("error", (error) => console.error("RabbitMQ consumer channel error:", error.message));
    channel.on("close", () => {
      channel = null;
      scheduleReconnect();
    });

    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    const queue = await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(queue.queue, EXCHANGE, "order.created");
    await channel.prefetch(5);

    await channel.consume(queue.queue, async (message) => {
      if (!message) return;

      let event;
      try {
        event = JSON.parse(message.content.toString("utf8"));
        if (
          event.event_type !== "order.created" ||
          !event.event_id ||
          !Number.isSafeInteger(Number(event.order_id)) ||
          !Number.isSafeInteger(Number(event.user_id)) ||
          !Number.isFinite(Number(event.amount)) ||
          Number(event.amount) < 0
        ) {
          throw new Error("Payload event order.created tidak valid.");
        }
      } catch (error) {
        console.error("Event RabbitMQ tidak valid dan dibuang:", error.message);
        channel?.nack(message, false, false);
        return;
      }

      try {
        await pool.query(
          `INSERT INTO payment_order_events
             (event_id, order_id, user_id, amount, event_type, payload)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)
           ON CONFLICT (event_id) DO NOTHING`,
          [
            event.event_id,
            Number(event.order_id),
            Number(event.user_id),
            Number(event.amount),
            event.event_type,
            JSON.stringify(event)
          ]
        );
        channel?.ack(message);
        console.log(`Event order.created diterima untuk order #${event.order_id}.`);
      } catch (error) {
        console.error("Event order.created gagal disimpan; pesan akan dicoba kembali:", error.message);
        channel?.nack(message, false, true);
      }
    });

    console.log("Payment Service terhubung ke RabbitMQ dan menunggu event order.created.");
  } catch (error) {
    console.error("RabbitMQ belum dapat dihubungi; mencoba kembali dalam 5 detik:", error.message);
    if (channel) await channel.close().catch(() => {});
    if (connection) await connection.close().catch(() => {});
    channel = null;
    connection = null;
    scheduleReconnect();
  } finally {
    starting = false;
  }
}

async function closeOrderCreatedConsumer() {
  stopping = true;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  if (channel) await channel.close().catch(() => {});
  if (connection) await connection.close().catch(() => {});
  channel = null;
  connection = null;
}

module.exports = { startOrderCreatedConsumer, closeOrderCreatedConsumer };
