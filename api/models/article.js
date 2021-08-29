const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;

const { EntityIdNotFound } = require("../utils/errors");

function _getArticlePageInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getAllNodesByFieldKey(record, 'article', true); 
        result["Written By"] = getAllNodesByFieldKey(record, 'researchers');
        result["Written About"] = getAllNodesByFieldKey(record, 'researches');   
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
    'COLLECT(DISTINCT research) AS researches,',
    'COLLECT(DISTINCT researcher) AS researchers',
    ].join('\n');
    const params = { articleId: articleId };

    return executeQuery(session, query, params)
    .then(response => {
        if (validateResponse(response)) {
            return _getArticlePageInfo(response.records[0]);
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