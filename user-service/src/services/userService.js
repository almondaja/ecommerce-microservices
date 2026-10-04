const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userRepository = require("../repositories/userRepository");

async function register(name, email, password) {
    if (!name || !email || !password) {
        throw new Error("Name, email, dan password wajib diisi");
    }

    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
        throw new Error("Email sudah digunakan");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return await userRepository.createUser(
        name,
        email,
        passwordHash
    );
}

async function login(email, password) {
    if (!email || !password) {
        throw new Error("Email dan password wajib diisi");
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
        throw new Error("Email atau password salah");
    }

    const validPassword = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!validPassword) {
        throw new Error("Email atau password salah");
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
}

async function getProfile(id) {
    return await userRepository.findById(id);
}

module.exports = {
    register,
    login,
    getProfile
};