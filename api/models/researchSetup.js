const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResult = databaseHandler.validateResult;
const getEntityList = databaseHandler.getAllRecordsByKey;
const getEntityProperties = databaseHandler.getRecordPropertiesByLabel;

const { EntityIdNotFound } = require("../utils/errors");

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
function getScheme() {
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
function getResearchSetupById(session, researchSetupId, next) {
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
        if (validateResult(result)) {
            return _singleResearchSetupFullInfo(result.records[0]);
        }
        else {
            throw new EntityIdNotFound('ResearchSetup', researchSetupId);
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
    getResearchSetupById: getResearchSetupById
}