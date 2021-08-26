const Product = require('../models/product');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getProductScheme(_req, res) {
    writeResponse(res, Product.getScheme());
}

function getProductById(req, res) {
    Product.getProductById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllProducts(req, res, next) {
    databaseHandler.getAllEntitiesByType(req, next, 'Product')
        .then(response => writeResponse(res, response));
}

module.exports = {
    getProductScheme: getProductScheme,
    getProductById: getProductById,
    listAllProducts: listAllProducts
}
