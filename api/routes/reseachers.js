const Researchers = require('../models/researcher');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function listAllResearchers(req, res) {
    Researchers.getAll(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

function getResearcherById(req, res) {
    Researchers.getResearcherById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllLabsWithActiveResearchByResearcher(req, res) {
    Researchers.getAllLabsWithActiveResearchByResearcher(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllProductsPurchasedByResearcher(req, res) {
    Researchers.getAllProductsPurchasedByResearcher(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchedAreasByResearcher(req, res) {
    Researchers.getAllResearchedAreasByResearcher(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

module.exports = {
    getResearcherById: getResearcherById,
    listAllResearchers: listAllResearchers,
    listAllLabsWithActiveResearchByResearcher: listAllLabsWithActiveResearchByResearcher,
    listAllProductsPurchasedByResearcher: listAllProductsPurchasedByResearcher,
    listAllResearchedAreasByResearcher: listAllResearchedAreasByResearcher
}