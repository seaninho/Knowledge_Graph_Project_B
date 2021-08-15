const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;

function _getProperties(record) {
    return record.properties;
}

function _singleLabFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result.Lab = _.map(record.get('lab'), record => _getProperties(record));
        result.Faculties = _.map(record.get('faculties'), record => _getProperties(record));
        result.Research_Areas = _.map(record.get('researchAreas'), record => _getProperties(record));
        result.Researchers = _.map(record.get('researchers'), record => _getProperties(record));
        result.Products = _.map(record.get('products'), record => _getProperties(record));        
        return result;
    }
    else {
        return null;
    }
}

// get lab by id
function getLabById(session, labId) {
    const query = [
    'MATCH (lab:Lab) WHERE lab.labId = $labId',
    'OPTIONAL MATCH (faculty:Faculty)<-[:PART_OF]-(lab)',
    'OPTIONAL MATCH (researcher:Researcher)-[:HAS_ACTIVE_PROJECT]->(lab)',
    'OPTIONAL MATCH (product:Product)-[:USED_AT]->(lab)',
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(r:Researcher)-[:HAS_ACTIVE_PROJECT]->(lab)',
    'WITH DISTINCT lab,',
    'researcher, product, faculty, researchArea',
    'RETURN COLLECT(DISTINCT lab) AS lab,',
    'COLLECT(DISTINCT faculty) as faculties,',
    'COLLECT(DISTINCT researcher) AS researchers,',
    'COLLECT(DISTINCT product) AS products,',
    'COLLECT(DISTINCT researchArea) AS researchAreas',
    ].join('\n');
    const params = { labId: labId };

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return _singleLabFullInfo(result.records[0]);
        }
        else {
            throw {message: 'Lab Not Found!', status: 404}
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
    getLabById: getLabById,
}