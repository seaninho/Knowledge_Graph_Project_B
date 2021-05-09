const Researchers = require('../models/researcher');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

const listAllResearchers = function (req, res) {
    Researchers.getAll(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

const getById = function (req, res) {
    Researchers.getResearcherById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearchedAreasByResearcher = function (req, res) {
    Researchers.getAllResearchedAreasByResearcher(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

module.exports = {
    listAllResearchers: listAllResearchers,
    getById: getById,
    listAllResearchedAreasByResearcher: listAllResearchedAreasByResearcher
}