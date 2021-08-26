const Researcher = require('../models/researcher');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;


function getResearcherById(req, res) {
    Researcher.getResearcherById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchers(req, res, next) {
    databaseHandler.getAllEntitiesByType(req, next, 'Researcher')
        .then(response => writeResponse(res, response));
}

module.exports = {
    getResearcherById: getResearcherById,
    listAllResearchers: listAllResearchers
}