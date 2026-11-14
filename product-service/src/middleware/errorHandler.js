function notFoundHandler(req, res) {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(`[${req.method} ${req.originalUrl}]`, error.message);
  const statusCode = Number(error.statusCode) || 500;
  res.status(statusCode).json({ message: statusCode >= 500 ? "Terjadi kesalahan pada server." : error.message });
}

module.exports = { notFoundHandler, errorHandler };
