const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;

function _getProperties(record) {
    return record.properties;
}

function _singleResearchFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result.Research = _.map(record.get('research'), record => _getProperties(record));
        result.Researchers = _.map(record.get('researchers'), record => _getProperties(record));
        result.Research_Areas = _.map(record.get('researchAreas'), record => _getProperties(record));
        result.Research_Setups = _.map(record.get('researchSetups'), record => _getProperties(record));
        result.Articles = _.map(record.get('articles'), record => _getProperties(record));
        return result;
    }
    else {
        return null;
    }
}

// get research by id
function getResearchById(session, researchId) {
    const query = [
    'MATCH (research:Research) WHERE research.researchId = $researchId',
    'OPTIONAL MATCH (researcher:Researcher)-[:CONDUCTS]->(research)',  
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(r:Researcher)-[:CONDUCTS]->(research)',  
    'OPTIONAL MATCH (researchSetup:ResearchSetup)-[:USED_IN]->(research)',
    'OPTIONAL MATCH (article:Article)-[:WROTE_REGARD_TO]->(research)',    
    'WITH DISTINCT research,',
    'researcher, researchArea, researchSetup, article',
    'RETURN COLLECT(DISTINCT research) AS research,',
    'COLLECT(DISTINCT researcher) as researchers,',
    'COLLECT(DISTINCT researchArea) AS researchAreas,',
    'COLLECT(DISTINCT researchSetup) AS researchSetups,',
    'COLLECT(DISTINCT article) AS articles',
    ].join('\n');
    const params = { researchId: researchId };

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return _singleResearchFullInfo(result.records[0]);
        }
        else {
            throw {message: 'Research Not Found!', status: 404}
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
    getResearchById: getResearchById,
}