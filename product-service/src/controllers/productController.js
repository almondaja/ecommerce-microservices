const productService = require("../services/productService");

async function getAllProducts(req, res) {
    try {
        const products =
            await productService.getAllProducts();

        res.status(200).json({
            message: "Data produk berhasil diambil",
            data: products
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Terjadi kesalahan server"
        });
    }
}

async function getProductById(req, res) {
    try {
        const product =
            await productService.getProductById(
                req.params.id
            );

        res.status(200).json({
            data: product
        });

    } catch (error) {
        res.status(404).json({
            message: error.message
        });
    }
}

async function createProduct(req, res) {
    try {
        const product =
            await productService.createProduct(
                req.body
            );

        res.status(201).json({
            message: "Produk berhasil dibuat",
            data: product
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

async function updateProduct(req, res) {
    try {
        const product =
            await productService.updateProduct(
                req.params.id,
                req.body
            );

        res.status(200).json({
            message: "Produk berhasil diperbarui",
            data: product
        });

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

async function deleteProduct(req, res) {
    try {
        const product =
            await productService.deleteProduct(
                req.params.id
            );

        res.status(200).json({
            message: "Produk berhasil dihapus",
            data: product
        });

    } catch (error) {
        res.status(404).json({
            message: error.message
        });
    }
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};