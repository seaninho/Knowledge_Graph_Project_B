const Labs = require('../models/lab');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

const listAllLabs = function (req, res) {
    Labs.getAll(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

const getById = function (req, res) {
    Labs.getLabById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearchersInLab = function (req, res) {
    Labs.getAllResearchersInLab(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearcheAreasInLab = function (req, res) {
    Labs.getAllResearcheAreasInLab(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllProductsUsedInLab = function (req, res) {
    Labs.getAllProductsUsedInLab(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    listAllLabs: listAllLabs,
    getById: getById,
    listAllResearchersInLab: listAllResearchersInLab,
    listAllResearcheAreasInLab: listAllResearcheAreasInLab,
    listAllProductsUsedInLab: listAllProductsUsedInLab
}