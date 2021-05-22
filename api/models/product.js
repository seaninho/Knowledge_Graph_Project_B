const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const response = require('../helpers/response');
const formatResponse = response.formatResponse;

// get all products
async function getAll(session) {
    const query = 'MATCH (product:Product) RETURN product';
    const params = {};
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
};

// get product by id
async function getProductById(session, productId) {
    const query =
    'MATCH (product:Product) WHERE product.productId = $productId \
    RETURN product';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all labs that use product with "productId"
async function getAllLabs(session, productId) {
    const query =
    'MATCH (p:Product) WHERE p.productId = $productId \
    MATCH(product: Product) WHERE product.deviceId = p.deviceId \
    MATCH(lab: Lab) < -[: USED_AT] - (: Product { deviceId: product.deviceId }) \
    RETURN DISTINCT lab';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all researchers that purchased product with "productId"
async function getAllResearchers(session, productId) {
    const query =
    'MATCH (p:Product) WHERE p.productId = $productId \
    MATCH(product: Product) WHERE product.deviceId = p.deviceId \
    MATCH (researcher:Researcher)-[:PURCHASED]->(:Product { deviceId: product.deviceId }) \
    RETURN DISTINCT researcher';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all research areas that use product with "productId"
async function getAllResearchAreas(session, productId) {
    const query =
    'MATCH (p:Product) WHERE p.productId = $productId \
    MATCH(product: Product) WHERE product.deviceId = p.deviceId \
    MATCH (researchArea:ResearchArea)<-[:USED_IN]-(:Product { deviceId: product.deviceId }) \
    RETURN DISTINCT researchArea';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all multiple purchsed products
async function getAllMultiplePurchased(session) {
    const query =
    'MATCH (r1:Researcher)-[:PURCHASED]->(p1:Product) \
    MATCH(r2: Researcher) - [: PURCHASED] -> (p2: Product { deviceId: p1.deviceId }) \
    WHERE r1 <> r2 \
    RETURN DISTINCT p2.deviceId';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// exported functions
module.exports = {
    getAll: getAll,
    getProductById: getProductById,
    getAllLabs: getAllLabs,
    getAllResearchers: getAllResearchers,
    getAllResearchAreas: getAllResearchAreas,
    getAllMultiplePurchased: getAllMultiplePurchased
}