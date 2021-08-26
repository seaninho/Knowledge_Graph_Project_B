const Article = require('../models/article');
const databaseHandler = require('../middleware/graphDBHandler');
const writeResponse = require('../helpers/response').writeResponse;


function getArticleById(req, res) {
    Article.getArticleById(databaseHandler.getSession(req), req.params.id)
        .then(response => writeResponse(res, response));
}

function listAllArticles(req, res, next) {
    databaseHandler.getAllEntitiesByType(req, next, 'Article')
        .then(response => writeResponse(res, response));
}

// exported functions
module.exports = {
    getArticleById: getArticleById,
    listAllArticles: listAllArticles
}