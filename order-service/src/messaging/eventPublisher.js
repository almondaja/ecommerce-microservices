const amqp = require("amqplib");
const crypto = require("crypto");

const EXCHANGE = "ecommerce.events";
let connection = null;
let channelPromise = null;

async function getChannel() {
  if (!process.env.AMQP_URL) return null;
  if (!channelPromise) {
    channelPromise = amqp.connect(process.env.AMQP_URL, { heartbeat: 30 })
      .then(async (conn) => {
        connection = conn;
        conn.on("error", (error) => console.error("RabbitMQ publisher connection error:", error.message));
        conn.on("close", () => {
          connection = null;
          channelPromise = null;
        });
        const channel = await conn.createConfirmChannel();
        channel.on("close", () => { channelPromise = null; });
        await channel.assertExchange(EXCHANGE, "topic", { durable: true });
        const queue = await channel.assertQueue("payment.order-created", { durable: true });
        await channel.bindQueue(queue.queue, EXCHANGE, "order.created");
        return channel;
      })
      .catch((error) => {
        channelPromise = null;
        connection = null;
        throw error;
      });
  }
  return channelPromise;
}

async function publishOrderCreated(order) {
  const channel = await getChannel();
  if (!channel) {
    console.warn("AMQP_URL belum diatur; event order.created tidak dipublikasikan.");
    return false;
  }

  const event = {
    event_id: crypto.randomUUID(),
    event_type: "order.created",
    occurred_at: new Date().toISOString(),
    order_id: Number(order.id),
    user_id: Number(order.user_id),
    amount: Number(order.total),
    currency: "IDR",
    items: (order.items || []).map((item) => ({
      product_id: Number(item.product_id),
      product_name: item.product_name,
      quantity: Number(item.quantity),
      price: Number(item.price)
    }))
  };

  await new Promise((resolve, reject) => {
    channel.publish(
      EXCHANGE,
      "order.created",
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json",
        messageId: event.event_id,
        timestamp: Date.now()
      },
      (error) => error ? reject(error) : resolve()
    );
  });

  return true;
}

async function closePublisher() {
  const channel = channelPromise ? await channelPromise.catch(() => null) : null;
  channelPromise = null;
  if (channel) await channel.close().catch(() => {});
  if (connection) await connection.close().catch(() => {});
  connection = null;
}

module.exports = { publishOrderCreated, closePublisher };
