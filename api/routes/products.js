const Products = require('../models/product');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function listAllProducts(req, res) {
    Products.getAll(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

function getById(req, res) {
    Products.getProductById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllLabsThatUseProductId(req, res) {
    Products.getAllLabs(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchersThatPurchasedProductId(req, res) {
    Products.getAllResearchers(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchAreasThatUseProductId(req, res) {
    Products.getAllResearchAreas(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllMultiplePurchased(req, res) {
    Products.getAllMultiplePurchased(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

module.exports = {
    listAllProducts: listAllProducts,
    getById: getById,
    listAllLabsThatUseProductId: listAllLabsThatUseProductId,
    listAllResearchersThatPurchasedProductId: listAllResearchersThatPurchasedProductId,
    listAllResearchAreasThatUseProductId: listAllResearchAreasThatUseProductId,
    listAllMultiplePurchased: listAllMultiplePurchased
}
