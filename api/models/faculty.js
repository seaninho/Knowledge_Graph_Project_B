const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResult = databaseHandler.validateResult;
const getEntityList = databaseHandler.getAllRecordsByKey;
const getEntityProperties = databaseHandler.getRecordPropertiesByLabel;

const { EntityIdNotFound } = require("../utils/errors");

function _getFacultyPageInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getEntityProperties(record, 'faculty');
        result["Faculty Labs"] = getEntityList(record, 'labs');
        result["Faculty Research Areas"] = getEntityList(record, 'researchAreas');
        result["Faculty Researchers"] = getEntityList(record, 'researchers');      
        return result;
    }
    else {
        return null;
    }
}

// get faculty scheme ("recipe")
function getScheme() {
    return {
        'entity': 'Faculty',
        'id': 'facultyId',
        'name': 'facultyName',
        'property': [],
        'edges': [
            {
                'src': 'Lab',
                'dst': 'Faculty',
                'edgeName': 'PART_OF'
            }
        ]
    };
};

// get faculty by id
function getFacultyById(session, facultyId, next) {
    const query = [
    'MATCH (faculty:Faculty) WHERE faculty.facultyId = $facultyId',
    'OPTIONAL MATCH (lab:Lab)-[:PART_OF]->(faculty)',    
    'OPTIONAL MATCH (researcher:Researcher)-[:HAS_ACTIVE_PROJECT]->(l:Lab)-[:PART_OF]->(faculty)',
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(researcher:Researcher)',    
    'WITH DISTINCT faculty,',
    'lab, researcher, researchArea',
    'RETURN COLLECT(DISTINCT faculty) AS faculty,',
    'COLLECT(DISTINCT lab) as labs,',
    'COLLECT(DISTINCT researcher) AS researchers,',
    'COLLECT(DISTINCT researchArea) AS researchAreas',
    ].join('\n');
    const params = { facultyId: facultyId };

    return executeQuery(session, query, params)
    .then(result => {
        if (validateResult(result)) {
            return _getFacultyPageInfo(result.records[0]);
        }
        else {
            throw new EntityIdNotFound('Faculty', facultyId);
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
    getFacultyById: getFacultyById
}