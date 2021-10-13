const _ = require('lodash');

const databaseHandler = require('../../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;

const { EntityIdNotFound } = require('../../utils/errors');

function _getResearchPageInfo(records) {
    if (records.length > 0) {
        var result = {};
        result['Entity'] = getAllNodesByFieldKey(records, 'research', true);
        result['Researchers'] = getAllNodesByFieldKey(records, 'researchers');
        result['Areas of Research'] = getAllNodesByFieldKey(records, 'researchAreas');
        result['Research Setup Used'] = getAllNodesByFieldKey(records, 'researchSetups');
        result['Articles Published'] = getAllNodesByFieldKey(records, 'articles');
        return result;
    } else {
        return null;
    }
}

// get research scheme ("recipe")
function getScheme() {
    return {
        entity: 'Research',
        id: 'researchId',
        name: 'researchName',
        property: [],
        edges: [
            {
                src: 'Researcher',
                dst: 'Research',
                edgeName: 'CONDUCTS',
            },
            {
                src: 'Research',
                dst: 'ResearchArea',
                edgeName: 'RELEVANT_TO',
            },
            {
                src: 'ResearchSetup',
                dst: 'Research',
                edgeName: 'USED_IN',
            },
            {
                src: 'Article',
                dst: 'Research',
                edgeName: 'WROTE_REGARD_TO',
            },
        ],
    };
}

// get research by id
function getResearchById(session, researchId, next) {
    const query = [
        'MATCH (research:Research) WHERE research.researchId = $researchId',
        'OPTIONAL MATCH (researcher:Researcher)-[:CONDUCTS]->(research)',
        'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(r:Researcher)-[:CONDUCTS]->(research)',
        'OPTIONAL MATCH (researchSetup:ResearchSetup)-[:USED_IN]->(research)',
        'OPTIONAL MATCH (article:Article)-[:WROTE_REGARD_TO]->(research)',
        'WITH DISTINCT research,',
        'researcher, researchArea, researchSetup, article',
        'RETURN COLLECT(DISTINCT research) AS research,',
        'COLLECT(DISTINCT researcher)[0..20] AS researchers,',
        'COLLECT(DISTINCT researchArea)[0..20] AS researchAreas,',
        'COLLECT(DISTINCT researchSetup)[0..20] AS researchSetups,',
        'COLLECT(DISTINCT article)[0..20] AS articles',
    ].join('\n');
    const params = { researchId: researchId };

    return executeQuery(session, query, params)
        .then((response) => {
            if (validateResponse(response)) {
                return _getResearchPageInfo(response.records);
            } else {
                throw new EntityIdNotFound('Research', researchId);
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
    getResearchById: getResearchById,
};
