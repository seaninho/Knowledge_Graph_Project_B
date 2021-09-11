const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;

const { EntityIdNotFound } = require("../utils/errors");

function _getArticlePageInfo(records) {
    if (records.length > 0) {
        var result = {};
        result["Entity"] = getAllNodesByFieldKey(records, 'article', true); 
        result["Written By"] = getAllNodesByFieldKey(records, 'researchers');
        result["Written About"] = getAllNodesByFieldKey(records, 'researches');   
        return result;
    }
    else {
        return null;
    }
}

// get article scheme ("recipe")
function getScheme() {
    return {
        'entity': 'Article',
        'id': 'articleId',
        'name': 'URL',
        'property': [],
        'edges': [
            {
                'src': 'Article',
                'dst': 'Research',
                'edgeName': 'WROTE_REGARD_TO'
            }
        ]
    };
};

// get article by id
function getArticleById(session, articleId, next) {
    const query = [
    'MATCH (article:Article) WHERE article.articleId = $articleId',
    'OPTIONAL MATCH (research:Research)<-[:WROTE_REGARD_TO]-(article)',    
    'OPTIONAL MATCH (researcher:Researcher)-[:CONDUCTS]->(r:Research)<-[:WROTE_REGARD_TO]-(article)',   
    'WITH DISTINCT article,',
    'research, researcher',
    'RETURN COLLECT(DISTINCT article) AS article,',
    'COLLECT(DISTINCT research)[0..20] AS researches,',
    'COLLECT(DISTINCT researcher)[0..20] AS researchers',
    ].join('\n');
    const params = { articleId: articleId };

    return executeQuery(session, query, params)
    .then(response => {
        if (validateResponse(response)) {
            return _getArticlePageInfo(response.records);
        }
        else {
            throw new EntityIdNotFound('Article', articleId);
        }
    })
    .catch(error => {      
      session.close();
      next(error);
    });
};

// exported functions
module.exports = {
    getScheme: getScheme,
    getArticleById: getArticleById
}