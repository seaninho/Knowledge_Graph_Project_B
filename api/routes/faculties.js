const Faculty = require('../models/faculty');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;


function getFacultyById(req, res) {
    Faculty.getFacultyById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getFacultyById: getFacultyById
}