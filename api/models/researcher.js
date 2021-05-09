const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const response = require('../helpers/response');
const formatResponse = response.formatResponse;

// get all researchers
async function getAll(session) {
    const query = 'MATCH (researcher:Researcher) RETURN researcher';
    const params = {};
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get researcher by id
async function getResearcherById(session, researcherId) {
    const query = 
    'MATCH (researcher:Researcher) WHERE researcher.id = $researcherId \
    RETURN researcher';
    const params = { researcherId: researcherId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get all labs with active research done by researcher with "researcherId"
async function getAllLabsWithActiveResearchByResearcher(session, researcherId) {
    const query =
    'MATCH (lab:Lab)<-[:HAS_ACTIVE_PROJECT]-(:Researcher { id: $researcherId} ) \
    RETURN DISTINCT lab';
    const params = { researcherId: researcherId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get all products purchased by researcher with "researcherId"
async function getAllProductsPurchasedByResearcher(session, researcherId) {
    const query =
    'MATCH (product:Product)<-[:PURCHASED]-(:Researcher { id: $researcherId} ) \
    RETURN DISTINCT product';
    const params = { researcherId: researcherId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get all reasearched areas researched by researcher with "researcherId"
async function getAllResearchedAreasByResearcher(session, researcherId) {
    const query =
    'MATCH (researchArea:ResearchArea)<-[:RESEARCH]-(:Researcher { id: $researcherId} ) \
    RETURN DISTINCT researchArea';
    const params = { researcherId: researcherId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// exported functions
module.exports = {
    getAll: getAll,
    getResearcherById: getResearcherById,
    getAllLabsWithActiveResearchByResearcher: getAllLabsWithActiveResearchByResearcher,
    getAllProductsPurchasedByResearcher: getAllProductsPurchasedByResearcher,
    getAllResearchedAreasByResearcher: getAllResearchedAreasByResearcher
}