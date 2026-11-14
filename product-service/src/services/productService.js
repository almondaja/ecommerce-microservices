const productRepository = require("../repositories/productRepository");

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError("ID produk tidak valid.");
  return id;
}

function normalizeProduct(data, current = {}) {
  const name = data.name === undefined ? current.name : String(data.name).trim();
  const category = data.category === undefined ? current.category : String(data.category).trim();
  const rawPrice = data.price === undefined ? current.price : data.price;
  const rawStock = data.stock === undefined ? current.stock : data.stock;
  const description = data.description === undefined ? (current.description ?? null) : (String(data.description).trim() || null);
  const price = Number(rawPrice);
  const stock = Number(rawStock);

  if (!name || name.length > 150) throw httpError("Nama produk wajib diisi (maksimal 150 karakter).");
  if (!category || category.length > 100) throw httpError("Kategori wajib diisi (maksimal 100 karakter).");
  if (rawPrice === undefined || !Number.isFinite(price) || price < 0) throw httpError("Harga produk harus berupa angka nol atau lebih.");
  if (rawStock === undefined || !Number.isSafeInteger(stock) || stock < 0) throw httpError("Stok produk harus berupa bilangan bulat nol atau lebih.");

  return { name, category, price: price.toFixed(2), stock, description };
}

async function getAllProducts(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 50));
  const result = await productRepository.findAll({
    search: typeof query.search === "string" ? query.search.trim() : "",
    category: typeof query.category === "string" ? query.category.trim() : "",
    limit,
    offset: (page - 1) * limit
  });
  return {
    products: result.items,
    pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
  };
}

async function getProductById(value) {
  const id = parseId(value);
  const product = await productRepository.findById(id);
  if (!product) throw httpError("Produk tidak ditemukan.", 404);
  return product;
}

async function createProduct(data) {
  return productRepository.create(normalizeProduct(data || {}));
}

async function updateProduct(value, data) {
  const id = parseId(value);
  const existing = await productRepository.findById(id);
  if (!existing) throw httpError("Produk tidak ditemukan.", 404);
  return productRepository.update(id, normalizeProduct(data || {}, existing));
}

async function deleteProduct(value) {
  const id = parseId(value);
  const product = await productRepository.remove(id);
  if (!product) throw httpError("Produk tidak ditemukan.", 404);
  return product;
}

async function reserveStock(value, rawQuantity) {
  const id = parseId(value);
  const quantity = Number(rawQuantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw httpError("Quantity reservasi harus berupa bilangan bulat positif.");
  }
  const product = await productRepository.reserveStock(id, quantity);
  if (product) return product;

  const existing = await productRepository.findById(id);
  if (!existing) throw httpError("Produk tidak ditemukan.", 404);
  throw httpError(`Stok ${existing.name} tidak mencukupi. Stok tersedia: ${existing.stock}.`, 409);
}

async function releaseStock(value, rawQuantity) {
  const id = parseId(value);
  const quantity = Number(rawQuantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw httpError("Quantity pengembalian harus berupa bilangan bulat positif.");
  }
  const product = await productRepository.releaseStock(id, quantity);
  if (!product) throw httpError("Produk tidak ditemukan.", 404);
  return product;
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, reserveStock, releaseStock };
