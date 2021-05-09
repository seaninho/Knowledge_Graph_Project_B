const databaseHandler = require('../middleware/graphDBHandler');
const formatResponse = require('../helpers/response').formatResponse;

// get all products
async function getAll(session) {
    const query = 'MATCH (product:Product) RETURN product';
    const params = {};
    const resultObj = await databaseHandler.executeCypherQuery(session, query, params);
    return formatResponse(resultObj);
};

// get product by id
async function getProductById(session, productId) {
    const query =
    'MATCH (product:Product) WHERE product.productID = $productId \
    RETURN product';
    const params = { productId: productId };
    const resultObj = await databaseHandler.executeCypherQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all labs that use product with "productId"
async function getAllLabs(session, productId) {
    const query =
    'MATCH (lab:Lab)<-[:USED_AT]-(:Product { productID: $productId} ) \
    RETURN DISTINCT lab';
    const params = { productId: productId };
    const resultObj = await databaseHandler.executeCypherQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all researchers that purchased product with "productId"
async function getAllResearchers(session, productId) {
    const query =
    'MATCH (researcher:Researcher)-[:PURCHASED]->(:Product { productID: $productId} ) \
    RETURN DISTINCT researcher';
    const params = { productId: productId };
    const resultObj = await databaseHandler.executeCypherQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all research areas that use product with "productId"
async function getAllResearchAreas(session, productId) {
    const query =
    'MATCH (researchArea:ResearchArea)<-[:USED_IN]-(:Product { productID: $productId} ) \
    RETURN DISTINCT researchArea';
    const params = { productId: productId };
    const resultObj = await databaseHandler.executeCypherQuery(session, query, params);
    return formatResponse(resultObj);
}

// exported functions
module.exports = {
    getAll: getAll,
    getProductById: getProductById,
    getAllLabs: getAllLabs,
    getAllResearchers: getAllResearchers,
    getAllResearchAreas: getAllResearchAreas
}