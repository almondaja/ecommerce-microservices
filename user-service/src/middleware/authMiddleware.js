const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token autentikasi diperlukan." });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT_SECRET belum dikonfigurasi." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "ecommerce-user-service"
    });
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak." });
    }
    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
