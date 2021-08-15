const Researches = require('../models/research');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

const getResearchById = function (req, res) {
    Researches.getResearchById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchById: getResearchById,
}