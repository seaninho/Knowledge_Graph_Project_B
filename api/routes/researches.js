const Research = require('../models/research');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getResearchScheme(_req, res) {
    writeResponse(res, Research.getResearchScheme());
}

function getResearchById(req, res) {
    Research.getResearchById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearches(req, res, next) {
    databaseHandler.getAllEntitiesByType(req, next, 'Research')
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchScheme: getResearchScheme,
    getResearchById: getResearchById,
    listAllResearches: listAllResearches
}