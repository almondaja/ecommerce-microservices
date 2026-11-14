const productService = require("../services/productService");

async function getAllProducts(req, res, next) {
  try {
    const result = await productService.getAllProducts(req.query);
    res.json({ message: "Data produk berhasil diambil.", data: result.products, pagination: result.pagination });
  } catch (error) { next(error); }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ data: product });
  } catch (error) { next(error); }
}

async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ message: "Produk berhasil dibuat.", data: product });
  } catch (error) { next(error); }
}

async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json({ message: "Produk berhasil diperbarui.", data: product });
  } catch (error) { next(error); }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await productService.deleteProduct(req.params.id);
    res.json({ message: "Produk berhasil dihapus.", data: product });
  } catch (error) { next(error); }
}

async function reserveStock(req, res, next) {
  try {
    const product = await productService.reserveStock(req.params.id, req.body.quantity);
    res.json({ message: "Stok berhasil direservasi.", data: product });
  } catch (error) { next(error); }
}

async function releaseStock(req, res, next) {
  try {
    const product = await productService.releaseStock(req.params.id, req.body.quantity);
    res.json({ message: "Reservasi stok berhasil dikembalikan.", data: product });
  } catch (error) { next(error); }
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, reserveStock, releaseStock };
