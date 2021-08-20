const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const getEntityList = databaseHandler.getEntityListByRecordKey;
const getEntityProperties = databaseHandler.getEntityPropertiesByLabel;
const response = require('../helpers/response');
const formatResponse = response.formatResponse;

function _singleFacultyFullInfo(record) {
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

// get faculty by id
function getFacultyById(session, facultyId) {
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
        if (!_.isEmpty(result.records)) {
            return _singleFacultyFullInfo(result.records[0]);
        }
        else {
            throw {message: 'Faculty Not Found!', status: 404}
        }
    })
    .catch(error => {
      console.log(error);
      session.close();
      return;
    });
};

function getAllFaculties(session) {
const query = [
    'MATCH (faculty:Faculty)',   
    'WITH DISTINCT faculty',
    'RETURN faculty',    
    ].join('\n');
    const params = {};

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return formatResponse(result);
        }
        else {
            throw {message: 'No Faculties Were Found!', status: 404}
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
    getFacultyById: getFacultyById,
    getAllFaculties: getAllFaculties
}