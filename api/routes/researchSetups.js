const ResearchSetups = require('../models/researchSetup');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getResearchSetupScheme(_req, res) {
    writeResponse(res, ResearchSetups.getResearchSetupScheme());
}

function getResearchSetupById(req, res) {
    ResearchSetups.getResearchSetupById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllResearchSetups(req, res) {
    ResearchSetups.getAllResearchSetups(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchSetupScheme: getResearchSetupScheme,
    getResearchSetupById: getResearchSetupById,
    listAllResearchSetups: listAllResearchSetups
}