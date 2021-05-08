const Researchers = require('../models/researcher');
const graphDBConnect = require('../middleware/graphDBConnect');
const writeResponse = require('../helpers/response').writeResponse;

const listAllResearchers = function (req, res) {
    Researchers.getAll(graphDBConnect.getSession(req))
        .then(response => writeResponse(res, response));
}

const getById = function (req, res) {
    Researchers.getResearcherById(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

const listAllResearchedAreasByResearcher = function (req, res) {
    Researchers.getAllResearchedAreasByResearcher(graphDBConnect.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

module.exports = {
    listAllResearchers: listAllResearchers,
    getById: getById,
    listAllResearchedAreasByResearcher: listAllResearchedAreasByResearcher
}