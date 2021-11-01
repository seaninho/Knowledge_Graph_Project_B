const _ = require('lodash');

const databaseHandler = require('../../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;

const { EntityIdNotFound } = require('../../utils/errors');

function _getFacultyPageInfo(records) {
    if (records.length > 0) {
        var result = {};
        var unconnected = {};
        result['Entity'] = getAllNodesByFieldKey(records, 'faculty', 'Faculty', true);
        result['Faculty Labs'] = getAllNodesByFieldKey(records, 'labs', 'Lab');
        unconnected['Faculty Research Areas'] = getAllNodesByFieldKey(
            records,
            'researchAreas',
            'ResearchArea'
        );
        unconnected['Faculty Researchers'] = getAllNodesByFieldKey(records, 'researchers', 'Researcher');
        // TODO: 'recommendation' is a hard-coded term used by front-end. Needs to be changed
        result['recommendations'] = unconnected;
        return result;
    } else {
        return null;
    }
}

// get faculty scheme ("recipe")
function getScheme() {
    return {
        entity: 'Faculty',
        id: 'facultyId',
        name: 'facultyName',
        property: [],
        edges: [
            {
                src: 'Lab',
                dst: 'Faculty',
                edgeName: 'PART_OF',
            },
        ],
    };
}

// get faculty by id
function getFacultyById(session, facultyId, next) {
    const query = [
        'MATCH (faculty:Faculty) WHERE faculty.facultyId = $facultyId',
        'OPTIONAL MATCH (lab:Lab)-[:PART_OF]->(faculty)',
        'OPTIONAL MATCH (researcher:Researcher)-[:ACTIVE_AT]->(l:Lab)-[:PART_OF]->(faculty)',
        'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(researcher:Researcher)',
        'WITH DISTINCT faculty,',
        'lab, researcher, researchArea',
        'RETURN COLLECT(DISTINCT faculty) AS faculty,',
        'COLLECT(DISTINCT lab)[0..20] AS labs,',
        'COLLECT(DISTINCT researcher)[0..20] AS researchers,',
        'COLLECT(DISTINCT researchArea)[0..20] AS researchAreas',
    ].join('\n');
    const params = { facultyId: facultyId };

    return executeQuery(session, query, params)
        .then((response) => {
            if (validateResponse(response)) {
                return _getFacultyPageInfo(response.records);
            } else {
                throw new EntityIdNotFound('Faculty', facultyId);
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
    getFacultyById: getFacultyById,
};
