const Researches = require('../models/research');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getResearchById(req, res) {
    Researches.getResearchById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearches(req, res) {
    Researches.getAllResearches(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchById: getResearchById,
    listAllResearches: listAllResearches
}