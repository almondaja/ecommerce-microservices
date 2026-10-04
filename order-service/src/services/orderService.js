const axios = require("axios");

const orderRepository = require("../repositories/orderRepository");

async function createOrder(userId, items) {
    if (!userId) {
        throw new Error("user_id wajib diisi");
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Item pesanan wajib diisi");
    }

    const processedItems = [];

    for (const item of items) {
        if (!item.product_id || !item.quantity) {
            throw new Error(
                "product_id dan quantity wajib diisi"
            );
        }

        if (Number(item.quantity) <= 0) {
            throw new Error(
                "Quantity harus lebih dari 0"
            );
        }

        const response = await axios.get(
            `${process.env.PRODUCT_SERVICE_URL}/products/${item.product_id}`
        );

        const product = response.data.data;

        if (!product) {
            throw new Error(
                `Produk ${item.product_id} tidak ditemukan`
            );
        }

        if (Number(product.stock) < Number(item.quantity)) {
            throw new Error(
                `Stok ${product.name} tidak mencukupi`
            );
        }

        const subtotal =
            Number(product.price) *
            Number(item.quantity);

        processedItems.push({
            product_id: product.id,
            product_name: product.name,
            price: Number(product.price),
            quantity: Number(item.quantity),
            subtotal
        });
    }

    const total = processedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
    );

    const client =
        await orderRepository.pool.connect();

    try {
        await client.query("BEGIN");

        const order =
            await orderRepository.createOrder(
                userId,
                total,
                "PENDING_PAYMENT",
                client
            );

        for (const item of processedItems) {
            await orderRepository.createOrderItem(
                order.id,
                item.product_id,
                item.product_name,
                item.price,
                item.quantity,
                item.subtotal,
                client
            );
        }

        await client.query("COMMIT");

        return await orderRepository.findById(order.id);

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

async function getOrders() {
    return await orderRepository.findAll();
}

async function getOrderById(id) {
    const order =
        await orderRepository.findById(id);

    if (!order) {
        throw new Error("Order tidak ditemukan");
    }

    return order;
}

async function updateOrderStatus(id, status) {
    const allowedStatuses = [
        "PENDING_PAYMENT",
        "PAID",
        "PROCESSING",
        "SHIPPED",
        "COMPLETED",
        "CANCELLED"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Status order tidak valid");
    }

    const order =
        await orderRepository.findById(id);

    if (!order) {
        throw new Error("Order tidak ditemukan");
    }

    return await orderRepository.updateStatus(
        id,
        status
    );
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
};