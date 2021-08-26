const ResearchSetup = require('../models/researchSetup');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;


function getResearchSetupById(req, res) {
    ResearchSetup.getResearchSetupById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchSetups(req, res, next) {
    databaseHandler.getAllEntitiesByType(req, next, 'ResearchSetup')
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchSetupById: getResearchSetupById,
    listAllResearchSetups: listAllResearchSetups
}