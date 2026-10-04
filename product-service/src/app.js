require("dotenv").config();

const express = require("express");
const cors = require("cors");

const productRoutes =
    require("./routes/productRoutes");

const { pool } =
    require("./repositories/productRepository");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            service: "product-service",
            status: "online",
            database: "connected"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            service: "product-service",
            status: "offline",
            database: "disconnected"
        });
    }
});

app.use("/products", productRoutes);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(
        `Product Service berjalan di http://localhost:${PORT}`
    );
});