const Articles = require('../models/article');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;

function getArticleScheme(_req, res) {
    writeResponse(res, Articles.getArticleScheme());
}

function getArticleById(req, res) {
    Articles.getArticleById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllArticles(req, res, next) {
    databaseHandler.getAllEntitiesByType(req, next, 'Article')
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getArticleScheme: getArticleScheme,
    getArticleById: getArticleById,
    listAllArticles: listAllArticles
}