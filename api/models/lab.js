const neo4j = require('neo4j-driver');
const graphDBConnect = require('../middleware/graphDBConnect');
const executeQuery = graphDBConnect.executeCypherQuery;
const response = require('../helpers/response');
const formatResponse = response.formatResponse;


// get all labs
const getAll = async function(session) {
    const query = 'MATCH (lab:Lab) RETURN lab';
    const params = {};
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get lab by id
const getLabById = async function (session, labId) {
    const query = 'MATCH (lab:Lab) WHERE lab.id = $labId RETURN lab';
    const params = { labId: labId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get all researchers in lab with "labId"
const getAllResearchersInLab = async function(session, labId) {
    const query = 
    'MATCH (researcher:Researcher)-[:HAS_ACTIVE_PROJECT]->(:Lab {id: $labId} ) \
    RETURN DISTINCT researcher';
    const params = { labId: labId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all research areas researched in lab with "labId"
const getAllResearcheAreasInLab = async function (session, labId) {
    const query = 
    'MATCH (researchArea:ResearchArea)-[:WAS_RESEARCHED_AT]->(:Lab { id: $labId} ) \
    RETURN DISTINCT researchArea';
    const params = { labId: labId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all products used in lab with "labId"
const getAllProductsUsedInLab = async function (session, labId) {
    const query =
    'MATCH (product:Product)-[:USED_AT]->(:Lab { id: $labId} ) \
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