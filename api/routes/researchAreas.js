const ResearchAreas = require('../models/researchArea');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getResearchAreaById(req, res) {
    ResearchAreas.getResearchAreaById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchAreas(req, res) {
    ResearchAreas.getAllResearchAreas(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchAreaById: getResearchAreaById,
    listAllResearchAreas: listAllResearchAreas
}