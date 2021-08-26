const ResearchArea = require('../models/researchArea');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;


function getResearchAreaById(req, res) {
    ResearchArea.getResearchAreaById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchAreas(req, res, next) {
    databaseHandler.getAllEntitiesByType(req, next, 'ResearchArea')
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchAreaById: getResearchAreaById,
    listAllResearchAreas: listAllResearchAreas
}