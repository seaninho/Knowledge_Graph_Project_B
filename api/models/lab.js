const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;


const { EntityIdNotFound } = require("../utils/errors");

function _getLabPageInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getAllNodesByFieldKey(record, 'lab', true);
        result["Department of"] = getAllNodesByFieldKey(record, 'faculty');
        result["Areas of Research"] = getAllNodesByFieldKey(record, 'researchAreas');
        result["Researchers"] = getAllNodesByFieldKey(record, 'researchers');
        result["Products"] = getAllNodesByFieldKey(record, 'products');        
        return result;
    }
    else {
        return null;
    }
}

// get lab scheme ("recipe")
function getScheme() {
    return {
        'entity': 'Lab',
        'id': 'labId',
        'name': 'labName',
        'property': [],
        'edges': [
            {
                'src': 'Lab',
                'dst': 'Faculty',
                'edgeName': 'PART_OF'
            },
            {
                'src': 'Researcher',
                'dst': 'Lab',
                'edgeName': 'ACTIVE_AT'
            },
            {
                'src': 'Product',
                'dst': 'Lab',
                'edgeName': 'USED_AT'
            },
            {
                'src': 'ResearchArea',
                'dst': 'Lab',
                'edgeName': 'WAS_RESEARCHED_AT'
            }
        ]
    };
};

// get lab by id
function getLabById(session, labId, next) {
    const query = [
    'MATCH (lab:Lab) WHERE lab.labId = $labId',
    'OPTIONAL MATCH (faculty:Faculty)<-[:PART_OF]-(lab)',
    'OPTIONAL MATCH (researcher:Researcher)-[:HAS_ACTIVE_PROJECT]->(lab)',
    'OPTIONAL MATCH (product:Product)-[:USED_AT]->(lab)',
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(r:Researcher)-[:HAS_ACTIVE_PROJECT]->(lab)',
    'WITH DISTINCT lab,',
    'researcher, product, faculty, researchArea',
    'RETURN COLLECT(DISTINCT lab) AS lab,',
    'COLLECT(DISTINCT faculty) as faculty,',
    'COLLECT(DISTINCT researcher) AS researchers,',
    'COLLECT(DISTINCT product) AS products,',
    'COLLECT(DISTINCT researchArea) AS researchAreas',
    ].join('\n');
    const params = { labId: labId };

    return executeQuery(session, query, params)
    .then(response => {
        if (validateResponse(response)) {
            return _getLabPageInfo(response.records[0]);
        }
        else {
            throw new EntityIdNotFound('Lab', labId);
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
    getLabById: getLabById
}