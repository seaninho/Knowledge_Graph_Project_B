const Labs = require('../models/lab');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

const getLabById = function (req, res) {
    Labs.getLabById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getLabById: getLabById,
}