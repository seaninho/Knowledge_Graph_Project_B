const Products = require('../models/product');
const graphDBConnect = require('../middleware/graphDBConnect');
const writeResponse = require('../helpers/response').writeResponse;

const listAllProducts = function (req, res) {
    Products.getAll(graphDBConnect.getSession(req))
        .then(response => writeResponse(res, response));
}

const getById = function (req, res) {
    Products.getProductById(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllLabsThatUseProductId = function (req, res) {
    Products.getAllLabs(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearchersThatPurchasedProductId = function (req, res) {
    Products.getAllResearchers(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearchAreasThatUseProductId = function (req, res) {
    Products.getAllResearchAreas(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

module.exports = {
    listAllProducts: listAllProducts,
    getById: getById,
    listAllLabsThatUseProductId: listAllLabsThatUseProductId,
    listAllResearchersThatPurchasedProductId: listAllResearchersThatPurchasedProductId,
    listAllResearchAreasThatUseProductId: listAllResearchAreasThatUseProductId
}
