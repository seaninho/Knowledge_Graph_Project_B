const Lab = require('../models/lab');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;


function getLabById(req, res) {
    Lab.getLabById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getLabById: getLabById
}