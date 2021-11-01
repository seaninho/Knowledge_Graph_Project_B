const _ = require('lodash');

const databaseHandler = require('../../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;

const { EntityIdNotFound } = require('../../utils/errors');

function _getResearchAreaPageInfo(records) {
    if (records.length > 0) {
        var result = {};
        var unconnected = {};
        result['Entity'] = getAllNodesByFieldKey(records, 'researchArea', 'ResearchArea', true);
        unconnected['Researched In Labs'] = getAllNodesByFieldKey(records, 'labs', 'Lab');
        result['Researches In This Area'] = getAllNodesByFieldKey(
            records,
            'researches',
            'Research'
        );
        result['Researchers In This Area'] = getAllNodesByFieldKey(
            records,
            'researchers',
            'Researcher'
        );
        unconnected['Products Used In This Area'] = getAllNodesByFieldKey(
            records,
            'products',
            'Product'
        );
        // TODO: 'recommendation' is a hard-coded term used by front-end. Needs to be changed
        result['recommendations'] = unconnected;
        return result;
    } else {
        return null;
    }
}

// get research area scheme ("recipe")
function getScheme() {
    return {
        entity: 'ResearchArea',
        id: 'researchAreaId',
        name: 'researchAreaName',
        property: [],
        edges: [
            {
                src: 'ResearchArea',
                dst: 'Lab',
                edgeName: 'WAS_RESEARCHED_AT',
            },
            {
                src: 'Researcher',
                dst: 'ResearchArea',
                edgeName: 'RESEARCHES',
            },
            {
                src: 'Research',
                dst: 'ResearchArea',
                edgeName: 'RELEVANT_TO',
            },
        ],
    };
}

// get research area by id
function getResearchAreaById(session, researchAreaId, next) {
    const query = [
        'MATCH (researchArea:ResearchArea) WHERE researchArea.researchAreaId = $researchAreaId',
        'OPTIONAL MATCH (research:Research)-[:RELEVANT_TO]->(researchArea)',
        'OPTIONAL MATCH (researcher:Researcher)-[:RESEARCHES]->(researchArea)',
        'OPTIONAL MATCH (product:Product)<-[:USING]-(r:Researcher)-[:RESEARCHES]->(researchArea)',
        'OPTIONAL MATCH (lab:Lab)<-[:ACTIVE_AT]-(rr:Researcher)-[:RESEARCHES]->(researchArea)',
        'WITH DISTINCT researchArea,',
        'research, researcher, product, lab',
        'ORDER BY product.isActiveProduct DESC',
        'RETURN COLLECT(DISTINCT researchArea) AS researchArea,',
        'COLLECT(DISTINCT research)[0..20] AS researches,',
        'COLLECT(DISTINCT researcher)[0..20] AS researchers,',
        'COLLECT(DISTINCT product)[0..20] AS products,',
        'COLLECT(DISTINCT lab)[0..20] AS labs',
    ].join('\n');
    const params = { researchAreaId: researchAreaId };

    return executeQuery(session, query, params)
        .then((response) => {
            if (validateResponse(response)) {
                return _getResearchAreaPageInfo(response.records);
            } else {
                throw new EntityIdNotFound('ResearchArea', researchAreaId);
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
    getResearchAreaById: getResearchAreaById,
};
