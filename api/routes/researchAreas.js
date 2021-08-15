const ResearchAreas = require('../models/researchArea');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

const getResearchAreaById = function (req, res) {
    ResearchAreas.getResearchAreaById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchAreaById: getResearchAreaById,
}