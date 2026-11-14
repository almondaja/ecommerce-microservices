const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function register(name, email, password) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!cleanName || !cleanEmail || typeof password !== "string") {
    throw httpError("Nama, email, dan password wajib diisi.");
  }
  if (cleanName.length < 2 || cleanName.length > 100) {
    throw httpError("Nama harus terdiri dari 2 sampai 100 karakter.");
  }
  if (!validateEmail(cleanEmail)) {
    throw httpError("Format email tidak valid.");
  }
  if (password.length < 6 || password.length > 72) {
    throw httpError("Password harus terdiri dari 6 sampai 72 karakter.");
  }

  const existingUser = await userRepository.findByEmail(cleanEmail);
  if (existingUser) {
    throw httpError("Email sudah digunakan.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    return await userRepository.createUser(cleanName, cleanEmail, passwordHash);
  } catch (error) {
    if (error.code === "23505") {
      throw httpError("Email sudah digunakan.", 409);
    }
    throw error;
  }
}

async function login(email, password) {
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!cleanEmail || typeof password !== "string" || !password) {
    throw httpError("Email dan password wajib diisi.", 400);
  }

  const user = await userRepository.findByEmail(cleanEmail);
  if (!user) {
    throw httpError("Email atau password salah.", 401);
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw httpError("Email atau password salah.", 401);
  }

  if (!process.env.JWT_SECRET) {
    throw httpError("JWT_SECRET belum dikonfigurasi pada server.", 500);
  }

  const token = jwt.sign(
    { id: Number(user.id), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d", issuer: "ecommerce-user-service" }
  );

  return {
    token,
    user: {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

async function getProfile(id) {
  return userRepository.findById(id);
}

module.exports = { register, login, getProfile };
