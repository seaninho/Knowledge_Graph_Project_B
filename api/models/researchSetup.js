const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;

function _getProperties(record) {
    return record.properties;
}

function _singleResearchSetupFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Research Setup Information"] = _.map(record.get('researchSetup'), record => _getProperties(record));
        result["Setup Products"] = _.map(record.get('products'), record => _getProperties(record));
        result["Used In Researches"] = _.map(record.get('researches'), record => _getProperties(record));                
        return result;
    }
    else {
        return null;
    }
}

// get research setup by id
function getResearchSetupById(session, researchSetupId) {
    const query = [
    'MATCH (researchSetup:ResearchSetup) WHERE researchSetup.researchSetupId = $researchSetupId',
    'OPTIONAL MATCH (product:Product)<-[:COMPOSED_OF]-(researchSetup)',
    'OPTIONAL MATCH (research:Research)<-[:USED_IN]-(researchSetup)',
    'WITH DISTINCT researchSetup,',
    'product, research',
    'RETURN COLLECT(DISTINCT researchSetup) AS researchSetup,',
    'COLLECT(DISTINCT product) as products,',
    'COLLECT(DISTINCT research) AS researches',
    ].join('\n');
    const params = { researchSetupId: researchSetupId };

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return _singleResearchSetupFullInfo(result.records[0]);
        }
        else {
            throw {message: 'Research Setup Not Found!', status: 404}
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
    getResearchSetupById: getResearchSetupById,
}