const Labs = require('../models/lab');
const graphDBConnect = require('../middleware/graphDBConnect');
const writeResponse = require('../helpers/response').writeResponse;

const listAllLabs = function (req, res) {
    Labs.getAll(graphDBConnect.getSession(req))
        .then(response => writeResponse(res, response));
}

const getById = function (req, res) {
    Labs.getLabById(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearchersInLab = function (req, res) {
    Labs.getAllResearchersInLab(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearcheAreasInLab = function (req, res) {
    Labs.getAllResearcheAreasInLab(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllProductsUsedInLab = function (req, res) {
    Labs.getAllProductsUsedInLab(graphDBConnect.getSession(req), req.params.id)
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