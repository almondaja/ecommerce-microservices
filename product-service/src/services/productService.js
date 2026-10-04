const productRepository = require("../repositories/productRepository");

async function getAllProducts() {
    return await productRepository.findAll();
}

async function getProductById(id) {
    const product = await productRepository.findById(id);

    if (!product) {
        throw new Error("Produk tidak ditemukan");
    }

    return product;
}

async function createProduct(data) {
    const {
        name,
        category,
        price,
        stock,
        description
    } = data;

    if (!name || !category) {
        throw new Error(
            "Nama dan kategori produk wajib diisi"
        );
    }

    if (price === undefined || Number(price) < 0) {
        throw new Error("Harga produk tidak valid");
    }

    if (stock === undefined || Number(stock) < 0) {
        throw new Error("Stok produk tidak valid");
    }

    return await productRepository.createProduct(
        name,
        category,
        Number(price),
        Number(stock),
        description || null
    );
}

async function updateProduct(id, data) {
    const existingProduct =
        await productRepository.findById(id);

    if (!existingProduct) {
        throw new Error("Produk tidak ditemukan");
    }

    const {
        name,
        category,
        price,
        stock,
        description
    } = data;

    if (!name || !category) {
        throw new Error(
            "Nama dan kategori produk wajib diisi"
        );
    }

    if (price === undefined || Number(price) < 0) {
        throw new Error("Harga produk tidak valid");
    }

    if (stock === undefined || Number(stock) < 0) {
        throw new Error("Stok produk tidak valid");
    }

    return await productRepository.updateProduct(
        id,
        name,
        category,
        Number(price),
        Number(stock),
        description || null
    );
}

async function deleteProduct(id) {
    const existingProduct =
        await productRepository.findById(id);

    if (!existingProduct) {
        throw new Error("Produk tidak ditemukan");
    }

    return await productRepository.deleteProduct(id);
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};