const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token autentikasi diperlukan." });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { issuer: "ecommerce-user-service" });
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Akses hanya untuk admin." });
  return next();
}

module.exports = { authenticateToken, requireAdmin };
