const Research = require('../models/research');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;


function getResearchById(req, res) {
    Research.getResearchById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getResearchById: getResearchById
}