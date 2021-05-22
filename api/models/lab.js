const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const response = require('../helpers/response');
const formatResponse = response.formatResponse;


// get all labs
async function getAll(session) {
    const query = 'MATCH (lab:Lab) RETURN lab';
    const params = {};
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get lab by id
async function getLabById(session, labId) {
    const query = 'MATCH (lab:Lab) WHERE lab.labId = $labId RETURN lab';
    const params = { labId: labId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get all researchers in lab with "labId"
async function getAllResearchersInLab(session, labId) {
    const query = 
    'MATCH (researcher:Researcher)-[:HAS_ACTIVE_PROJECT]->(:Lab {labId: $labId} ) \
    RETURN DISTINCT researcher';
    const params = { labId: labId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all research areas researched in lab with "labId"
async function getAllResearcheAreasInLab(session, labId) {
    const query = 
    'MATCH (researchArea:ResearchArea)-[:WAS_RESEARCHED_AT]->(:Lab { labId: $labId} ) \
    RETURN DISTINCT researchArea';
    const params = { labId: labId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all products used in lab with "labId"
async function getAllProductsUsedInLab(session, labId) {
    const query =
    'MATCH (product:Product)-[:USED_AT]->(:Lab { labId: $labId} ) \
    RETURN DISTINCT product';
    const params = { labId: labId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// exported functions
module.exports = {
    getAll: getAll,
    getLabById: getLabById,
    getAllResearchersInLab: getAllResearchersInLab,
    getAllResearcheAreasInLab: getAllResearcheAreasInLab,
    getAllProductsUsedInLab: getAllProductsUsedInLab
}