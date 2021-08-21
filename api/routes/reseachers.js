const Researchers = require('../models/researcher');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getResearcherScheme(_req, res) {
    writeResponse(res, Researchers.getResearcherScheme());
}

function getResearcherById(req, res) {
    Researchers.getResearcherById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchers(req, res) {
    Researchers.getAllResearchers(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

module.exports = {
    getResearcherScheme: getResearcherScheme,
    getResearcherById: getResearcherById,
    listAllResearchers: listAllResearchers
}