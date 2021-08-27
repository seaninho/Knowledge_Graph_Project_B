const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const getEntityList = databaseHandler.getEntityListByRecordKey;
const getEntityProperties = databaseHandler.getRecordPropertiesByLabel;

function _singleLabFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getEntityProperties(record, 'lab');
        result["Department of"] = getEntityList(record, 'faculty');
        result["Areas of Research"] = getEntityList(record, 'researchAreas');
        result["Researchers"] = getEntityList(record, 'researchers');
        result["Products"] = getEntityList(record, 'products');        
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
    'COLLECT(DISTINCT faculty) as faculty,',
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
    getScheme: getScheme,
    getLabById: getLabById
}