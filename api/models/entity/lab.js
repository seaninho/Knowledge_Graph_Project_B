const _ = require('lodash');

const databaseHandler = require('../../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;

const { EntityIdNotFound } = require('../../utils/errors');

function _getLabPageInfo(records) {
    if (records.length > 0) {
        var result = {};
        var unconnected = {};
        result['Entity'] = getAllNodesByFieldKey(records, 'lab', 'Lab', true);
        result['Department of'] = getAllNodesByFieldKey(records, 'faculty', 'Faculty');
        unconnected['Areas of Research'] = getAllNodesByFieldKey(
            records,
            'researchAreas',
            'ResearchArea'
        );
        result['Researchers'] = getAllNodesByFieldKey(records, 'researchers', 'Researcher');
        result['Products'] = getAllNodesByFieldKey(records, 'products', 'Product');
        // TODO: 'recommendation' is a hard-coded term used by front-end. Needs to be changed
        result['recommendations'] = unconnected;
        return result;
    } else {
        return null;
    }
}

// get lab scheme ("recipe")
function getScheme() {
    return {
        entity: 'Lab',
        id: 'labId',
        name: 'labName',
        property: [],
        edges: [
            {
                src: 'Lab',
                dst: 'Faculty',
                edgeName: 'PART_OF',
            },
            {
                src: 'Researcher',
                dst: 'Lab',
                edgeName: 'ACTIVE_AT',
            },
            {
                src: 'Product',
                dst: 'Lab',
                edgeName: 'USED_AT',
            },
            {
                src: 'ResearchArea',
                dst: 'Lab',
                edgeName: 'WAS_RESEARCHED_AT',
            },
        ],
    };
}

// get lab by id
function getLabById(session, labId, next) {
    const query = [
        'MATCH (lab:Lab) WHERE lab.labId = $labId',
        'OPTIONAL MATCH (faculty:Faculty)<-[:PART_OF]-(lab)',
        'OPTIONAL MATCH (researcher:Researcher)-[:ACTIVE_AT]->(lab)',
        'OPTIONAL MATCH (product:Product)-[:USED_AT]->(lab)',
        'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(r:Researcher)-[:ACTIVE_AT]->(lab)',
        'WITH DISTINCT lab,',
        'researcher, product, faculty, researchArea',
        'ORDER BY product.isActiveProduct DESC',
        'RETURN COLLECT(DISTINCT lab) AS lab,',
        'COLLECT(DISTINCT faculty)[0..20] AS faculty,',
        'COLLECT(DISTINCT researcher)[0..20] AS researchers,',
        'COLLECT(DISTINCT product)[0..20] AS products,',
        'COLLECT(DISTINCT researchArea)[0..20] AS researchAreas',
    ].join('\n');
    const params = { labId: labId };

    return executeQuery(session, query, params)
        .then((response) => {
            if (validateResponse(response)) {
                return _getLabPageInfo(response.records);
            } else {
                throw new EntityIdNotFound('Lab', labId);
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
    getLabById: getLabById,
};
