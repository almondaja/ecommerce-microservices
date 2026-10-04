require("dotenv").config();

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const { pool } = require("./repositories/userRepository");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            service: "user-service",
            status: "online",
            database: "connected"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            service: "user-service",
            status: "offline",
            database: "disconnected"
        });
    }
});

app.use("/users", userRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`User Service berjalan di http://localhost:${PORT}`);
});