const userService = require("../services/userService");

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        const user = await userService.register(
            name,
            email,
            password
        );

        res.status(201).json({
            message: "Registrasi berhasil",
            data: user
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        const result = await userService.login(
            email,
            password
        );

        res.status(200).json({
            message: "Login berhasil",
            data: result
        });

    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
}

async function profile(req, res) {
    try {
        const user = await userService.getProfile(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan"
            });
        }

        res.json({
            data: user
        });

    } catch (error) {
        res.status(500).json({
            message: "Terjadi kesalahan server"
        });
    }
}

module.exports = {
    register,
    login,
    profile
};