const crypto = require("crypto");

function internalAuth(req, res, next) {
  const expected = process.env.INTERNAL_SERVICE_TOKEN || "";
  const received = String(req.headers["x-internal-token"] || "");
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ message: "Akses internal service ditolak." });
  }
  return next();
}

module.exports = { internalAuth };
