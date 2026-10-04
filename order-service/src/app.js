require("dotenv").config();

const express = require("express");
const cors = require("cors");

const orderRoutes =
    require("./routes/orderRoutes");

const {
    pool
} = require("./repositories/orderRepository");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            service: "order-service",
            status: "online",
            database: "connected"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            service: "order-service",
            status: "offline",
            database: "disconnected"
        });
    }
});

app.use("/orders", orderRoutes);

const PORT =
    process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(
        `Order Service berjalan di http://localhost:${PORT}`
    );
});