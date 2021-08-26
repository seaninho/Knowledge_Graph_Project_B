const Lab = require('../models/lab');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getLabScheme(_req, res) {
    writeResponse(res, Lab.getScheme());
}

function getLabById(req, res) {
    Lab.getLabById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllLabs(req, res, next) {
    databaseHandler.getAllEntitiesByType(req, next, 'Lab')
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getLabScheme: getLabScheme,
    getLabById: getLabById,
    listAllLabs: listAllLabs
}