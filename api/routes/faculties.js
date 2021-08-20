const Faculties = require('../models/faculty');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getFacultyById(req, res) {
    Faculties.getFacultyById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllFaculties(req, res) {
    Faculties.getAllFaculties(databaseHandler.getSession(req))
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getFacultyById: getFacultyById,
    listAllFaculties: listAllFaculties
}