const Researchers = require('../models/researcher');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getResearcherById(req, res) {
    Researchers.getResearcherById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

module.exports = {
    getResearcherById: getResearcherById,
}