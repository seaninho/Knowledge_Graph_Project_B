const _ = require('lodash');

const databaseHandler = require('../../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;

const { EntityIdNotFound } = require('../../utils/errors');

function _getResearchSetupPageInfo(records) {
    if (records.length > 0) {
        var result = {};
        result['Entity'] = getAllNodesByFieldKey(records, 'researchSetup', 'ResearchSetup', true);
        result['Setup Products'] = getAllNodesByFieldKey(records, 'products', 'Product');
        result['Used In Researches'] = getAllNodesByFieldKey(records, 'researches', 'Research');
        return result;
    } else {
        return null;
    }
}

// get research setup scheme ("recipe")
function getScheme() {
    return {
        entity: 'ResearchSetup',
        id: 'researchSetupId',
        name: 'researchSetupName',
        property: [],
        edges: [
            {
                src: 'ResearchSetup',
                dst: 'Product',
                edgeName: 'COMPOSED_OF',
            },
            {
                src: 'ResearchSetup',
                dst: 'Research',
                edgeName: 'USED_IN',
            },
        ],
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
        'ORDER BY product.isActiveProduct DESC',
        'RETURN COLLECT(DISTINCT researchSetup) AS researchSetup,',
        'COLLECT(DISTINCT product)[0..20] AS products,',
        'COLLECT(DISTINCT research)[0..20] AS researches',
    ].join('\n');
    const params = { researchSetupId: researchSetupId };

    return executeQuery(session, query, params)
        .then((response) => {
            if (validateResponse(response)) {
                return _getResearchSetupPageInfo(response.records);
            } else {
                throw new EntityIdNotFound('ResearchSetup', researchSetupId);
            }
        })
        .catch((error) => {
            session.close();
            next(error);
        });
}

// exported functions
module.exports = {
    getScheme: getScheme,
    getResearchSetupById: getResearchSetupById,
};
