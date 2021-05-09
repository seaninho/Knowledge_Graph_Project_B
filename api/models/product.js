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
    'MATCH (product:Product) WHERE product.productID = $productId \
    RETURN product';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all labs that use product with "productId"
async function getAllLabs(session, productId) {
    const query =
    'MATCH (p:Product) WHERE p.productID = $productId \
    MATCH(product: Product) WHERE product.deviceID = p.deviceID \
    MATCH(lab: Lab) < -[: USED_AT] - (: Product { deviceID: product.deviceID }) \
    RETURN DISTINCT lab';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all researchers that purchased product with "productId"
async function getAllResearchers(session, productId) {
    const query =
    'MATCH (p:Product) WHERE p.productID = $productId \
    MATCH(product: Product) WHERE product.deviceID = p.deviceID \
    MATCH (researcher:Researcher)-[:PURCHASED]->(:Product { deviceID: product.deviceID }) \
    RETURN DISTINCT researcher';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all research areas that use product with "productId"
async function getAllResearchAreas(session, productId) {
    const query =
    'MATCH (p:Product) WHERE p.productID = $productId \
    MATCH(product: Product) WHERE product.deviceID = p.deviceID \
    MATCH (researchArea:ResearchArea)<-[:USED_IN]-(:Product { deviceID: product.deviceID }) \
    RETURN DISTINCT researchArea';
    const params = { productId: productId };
    const resultObj = await executeQuery(session, query, params);
    return formatResponse(resultObj);
}

// get all multiple purchsed products
async function getAllMultiplePurchased(session) {
    const query =
    'MATCH (r1:Researcher)-[:PURCHASED]->(p1:Product) \
    MATCH(r2: Researcher) - [: PURCHASED] -> (p2: Product { deviceID: p1.deviceID }) \
    WHERE r1 <> r2 \
    RETURN DISTINCT p2.deviceID';
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