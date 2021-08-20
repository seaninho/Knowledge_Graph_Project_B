const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const getEntityList = databaseHandler.getEntityListByRecordKey;
const getEntityProperties = databaseHandler.getEntityPropertiesByLabel;

function _singleResearchFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getEntityProperties(record, 'research');
        result["Researchers"] = getEntityList(record, 'researchers');
        result["Areas of Research"] = getEntityList(record, 'researchAreas');
        result["Research Setup Used"] = getEntityList(record, 'researchSetups');
        result["Articles Published"] = getEntityList(record, 'articles');
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

function getAllResearches(session) {
const query = [
    'MATCH (research:Research)',
    'RETURN COLLECT(DISTINCT research) AS research',    
    ].join('\n');
    const params = {};

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return getEntityList(result.records[0], 'research');
        }
        else {
            throw {message: 'No Researches Were Found!', status: 404}
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
    getAllResearches: getAllResearches
}