const userService = require("../services/userService");

async function register(req, res, next) {
  try {
    const user = await userService.register(req.body.name, req.body.email, req.body.password);
    res.status(201).json({ message: "Registrasi berhasil.", data: user });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await userService.login(req.body.email, req.body.password);
    res.status(200).json({ message: "Login berhasil.", data: result });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await userService.getProfile(req.user.id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan." });
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const requestedId = Number(req.params.id);
    if (!Number.isInteger(requestedId) || requestedId < 1) {
      return res.status(400).json({ message: "ID user tidak valid." });
    }
    if (req.user.role !== "admin" && Number(req.user.id) !== requestedId) {
      return res.status(403).json({ message: "Tidak boleh melihat profil pengguna lain." });
    }
    const user = await userService.getProfile(requestedId);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan." });
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, me, getById };
