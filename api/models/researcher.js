const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;

function _getProperties(record) {
    return record.properties;
}

function _singleResearcherFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result.Researcher = _.map(record.get('researcher'), record => _getProperties(record));
        result.Labs = _.map(record.get('labs'), record => _getProperties(record));
        result.Research_Areas = _.map(record.get('researchAreas'), record => _getProperties(record));
        result.Researches = _.map(record.get('researches'), record => _getProperties(record));
        result.Articles = _.map(record.get('articles'), record => _getProperties(record));
        result.Purchased_Products = _.map(record.get('products'), record => _getProperties(record));
        return result;
    }
    else {
        return null;
    }
}

// get researcher by id
function getResearcherById(session, researcherId) {
    const query = [
    'MATCH (researcher:Researcher) WHERE researcher.researcherId = $researcherId',
    'OPTIONAL MATCH (lab:Lab)<-[:HAS_ACTIVE_PROJECT]-(researcher)',
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(researcher)',
    'OPTIONAL MATCH (research:Research)<-[:CONDUCTS]-(researcher)',
    'OPTIONAL MATCH (article:Article)-[:WROTE_REGARD_TO]->(r:Research)<-[:CONDUCTS]-(researcher)',
    'OPTIONAL MATCH (product:Product)<-[:USING]-(researcher)',    
    'WITH DISTINCT researcher,',
    'lab, researchArea, research, article, product',
    'RETURN COLLECT(DISTINCT researcher) AS researcher,',
    'COLLECT(DISTINCT lab) AS labs,',
    'COLLECT(DISTINCT researchArea) AS researchAreas,',
    'COLLECT(DISTINCT research) as researches,',
    'COLLECT(DISTINCT article) as articles,',
    'COLLECT(DISTINCT product) AS products',
    ].join('\n');
    const params = { researcherId: researcherId };

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return _singleResearcherFullInfo(result.records[0]);
        }
        else {
            throw {message: 'Researcher Not Found!', status: 404}
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
    getResearcherById: getResearcherById,
}