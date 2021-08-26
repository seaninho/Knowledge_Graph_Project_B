const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const getEntityList = databaseHandler.getEntityListByRecordKey;
const getEntityProperties = databaseHandler.getEntityPropertiesByLabel;

function _singleArticleFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getEntityProperties(record, 'article');
        result["Written By"] = getEntityList(record, 'researchers');
        result["Written About"] = getEntityList(record, 'researches');   
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
function getArticleById(session, articleId) {
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
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return _singleArticleFullInfo(result.records[0]);
        }
        else {
            throw {message: 'Article Not Found!', status: 404}
        }
    })
    .catch(error => {
      console.log(error);
      session.close();
      return;
    });
};

// exported functions
module.exports = {
    getScheme: getScheme,
    getArticleById: getArticleById
}