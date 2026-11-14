const crypto = require("crypto");

function internalAuth(req, res, next) {
  const expected = process.env.INTERNAL_SERVICE_TOKEN || "";
  const received = req.headers["x-internal-token"] || "";
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(String(received));

  if (!expected || expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return res.status(403).json({ message: "Akses internal service ditolak." });
  }
  return next();
}

module.exports = { internalAuth };
