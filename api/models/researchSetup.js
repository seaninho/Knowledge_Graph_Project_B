const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const getEntityList = databaseHandler.getEntityListByRecordKey;
const getEntityProperties = databaseHandler.getEntityPropertiesByLabel;

function _singleResearchSetupFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getEntityProperties(record, 'researchSetup');
        result["Setup Products"] = getEntityList(record, 'products');
        result["Used In Researches"] = getEntityList(record, 'researches');
        return result;
    }
    else {
        return null;
    }
};

// get research setup scheme ("recipe")
function getResearchSetupScheme() {
    return {
        'entity': 'ResearchSetup',
        'id': 'researchSetupId',
        'name': 'researchSetupName',
        'property': [],
        'edges': [
            {
                'src': 'ResearchSetup',
                'dst': 'Product',
                'edgeName': 'COMPOSED_OF'
            }
        ]
    };
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

// get all research setups in our database
function getAllResearchSetups(session) {
const query = [
    'MATCH (researchSetup:ResearchSetup)',
    'RETURN COLLECT(DISTINCT researchSetup) AS researchSetup',    
    ].join('\n');
    const params = {};

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return getEntityList(result.records[0], 'researchSetup');
        }
        else {
            throw {message: 'No Research Setups Were Found!', status: 404}
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
    getResearchSetupScheme: getResearchSetupScheme,
    getResearchSetupById: getResearchSetupById,
    getAllResearchSetups: getAllResearchSetups
}