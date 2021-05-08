const graphDBConnect = require('../middleware/graphDBConnect');
const formatResponse = require('../helpers/response').formatResponse;

// get all researchers
const getAll = async function (session) {
    const query = 'MATCH (researcher:Researcher) RETURN researcher';
    const params = {};
    const resultObj = await graphDBConnect.executeCypherQuery(session, query, params);
    return formatResponse(resultObj);
};

// get researcher by id
const getResearcherById = async function (session, researcherId) {
    const query = 
    'MATCH (researcher:Researcher) WHERE researcher.id = $researcherId \
    RETURN researcher';
    const params = { researcherId: researcherId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get all labs with active research done by researcher with "researcherId"
const getAllLabsWithActiveResearchByResearcher = async function (session, researcherId) {
    const query =
    'MATCH (lab:Lab)<-[:HAS_ACTIVE_PROJECT]-(:Researcher { id: $researcherId} ) \
    RETURN DISTINCT lab';
    const params = { researcherId: researcherId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get all products purchased by researcher with "researcherId"
const getAllProductsPurchasedByResearcher = async function (session, researcherId) {
    const query =
    'MATCH (product:Product)<-[:PURCHASED]-(:Researcher { id: $researcherId} ) \
    RETURN DISTINCT product';
    const params = { researcherId: researcherId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get all reasearched areas researched by researcher with "researcherId"
const getAllResearchedAreasByResearcher = async function (session, researcherId) {
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