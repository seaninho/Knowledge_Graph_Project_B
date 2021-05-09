const Researchers = require('../models/researcher');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function listAllResearchers(req, res) {
    Researchers.getAll(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

function getById(req, res) {
    Researchers.getResearcherById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchedAreasByResearcher(req, res) {
    Researchers.getAllResearchedAreasByResearcher(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

module.exports = {
    listAllResearchers: listAllResearchers,
    getById: getById,
    listAllResearchedAreasByResearcher: listAllResearchedAreasByResearcher
}