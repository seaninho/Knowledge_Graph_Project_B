const Products = require('../models/product');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function listAllProducts(req, res) {
    Products.getAll(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

function getProductById(req, res) {
    Products.getProductById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllLabsThatUseProductById(req, res) {
    Products.getAllLabs(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchersThatPurchasedProductById(req, res) {
    Products.getAllResearchers(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchAreasThatUseProductById(req, res) {
    Products.getAllResearchAreas(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllMultiplePurchased(req, res) {
    Products.getAllMultiplePurchased(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

module.exports = {
    listAllProducts: listAllProducts,
    getProductById: getProductById,
    listAllLabsThatUseProductById: listAllLabsThatUseProductById,
    listAllResearchersThatPurchasedProductById: listAllResearchersThatPurchasedProductById,
    listAllResearchAreasThatUseProductById: listAllResearchAreasThatUseProductById,
    listAllMultiplePurchased: listAllMultiplePurchased
}
