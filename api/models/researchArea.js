const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;

function _getProperties(record) {
    return record.properties;
}

function _singleResearchAreaFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Research Area Information"] = _.map(record.get('researchArea'), record => _getProperties(record));
        result["Researched In Labs"] = _.map(record.get('labs'), record => _getProperties(record));
        result["Researches In This Area"] = _.map(record.get('researches'), record => _getProperties(record));
        result["Researchers In This Area"] = _.map(record.get('researchers'), record => _getProperties(record));
        result["Products Used In This Area"] = _.map(record.get('products'), record => _getProperties(record));        
        return result;
    }
    else {
        return null;
    }
}

// get research area by id
function getResearchAreaById(session, researchAreaId) {
    const query = [
    'MATCH (researchArea:ResearchArea) WHERE researchArea.researchAreaId = $researchAreaId',    
    'OPTIONAL MATCH (research:Research)-[:RELEVANT_TO]->(researchArea)',
    'OPTIONAL MATCH (researcher:Researcher)-[:RESEARCHES]->(researchArea)',    
    'OPTIONAL MATCH (product:Product)<-[:USING]-(r:Researcher)-[:RESEARCHES]->(researchArea)',
    'OPTIONAL MATCH (lab:Lab)<-[:HAS_ACTIVE_PROJECT]-(rr:Researcher)-[:RESEARCHES]->(researchArea)',
    'WITH DISTINCT researchArea,',
    'research, researcher, product, lab',
    'RETURN COLLECT(DISTINCT researchArea) AS researchArea,',
    'COLLECT(DISTINCT research) AS researches,',
    'COLLECT(DISTINCT researcher) AS researchers,',
    'COLLECT(DISTINCT product) AS products,',
    'COLLECT(DISTINCT lab) AS labs',
    ].join('\n');
    const params = { researchAreaId: researchAreaId };

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return _singleResearchAreaFullInfo(result.records[0]);
        }
        else {
            throw {message: 'Research Area Not Found!', status: 404}
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
    getResearchAreaById: getResearchAreaById,
}