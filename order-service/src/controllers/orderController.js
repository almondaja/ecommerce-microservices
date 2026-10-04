const orderService =
    require("../services/orderService");

async function createOrder(req, res) {
    try {
        const {
            user_id,
            items
        } = req.body;

        const order =
            await orderService.createOrder(
                user_id,
                items
            );

        res.status(201).json({
            message: "Order berhasil dibuat",
            data: order
        });

    } catch (error) {
        console.error(error);

        if (error.response) {
            return res.status(400).json({
                message:
                    "Gagal mengambil data produk"
            });
        }

        res.status(400).json({
            message: error.message
        });
    }
}

async function getOrders(req, res) {
    try {
        const orders =
            await orderService.getOrders();

        res.status(200).json({
            message: "Data order berhasil diambil",
            data: orders
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Terjadi kesalahan server"
        });
    }
}

async function getOrderById(req, res) {
    try {
        const order =
            await orderService.getOrderById(
                req.params.id
            );

        res.json({
            data: order
        });

    } catch (error) {
        res.status(404).json({
            message: error.message
        });
    }
}

async function updateOrderStatus(req, res) {
    try {
        const order =
            await orderService.updateOrderStatus(
                req.params.id,
                req.body.status
            );

        res.json({
            message: "Status order berhasil diperbarui",
            data: order
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
};