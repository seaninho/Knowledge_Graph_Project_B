const Products = require('../models/product');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

const listAllProducts = function (req, res) {
    Products.getAll(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

const getById = function (req, res) {
    Products.getProductById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllLabsThatUseProductId = function (req, res) {
    Products.getAllLabs(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearchersThatPurchasedProductId = function (req, res) {
    Products.getAllResearchers(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearchAreasThatUseProductId = function (req, res) {
    Products.getAllResearchAreas(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

module.exports = {
    listAllProducts: listAllProducts,
    getById: getById,
    listAllLabsThatUseProductId: listAllLabsThatUseProductId,
    listAllResearchersThatPurchasedProductId: listAllResearchersThatPurchasedProductId,
    listAllResearchAreasThatUseProductId: listAllResearchAreasThatUseProductId
}
