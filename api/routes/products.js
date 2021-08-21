const Products = require('../models/product');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getProductScheme(_req, res) {
    writeResponse(res, Products.getProductScheme());
}

function getProductById(req, res) {
    Products.getProductById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllProducts(req, res) {
    Products.getAllProducts(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

module.exports = {
    getProductScheme: getProductScheme,
    getProductById: getProductById,
    listAllProducts: listAllProducts
}
