const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;

function _getProperties(record) {
    return record.properties;
}

function _singleProductFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result.Product = _.map(record.get('product'), record => _getProperties(record));
        result.Labs = _.map(record.get('labs'), record => _getProperties(record));
        result.Research_Areas = _.map(record.get('researchAreas'), record => _getProperties(record));
        result.Researchers = _.map(record.get('researchers'), record => _getProperties(record));
        result.Research_Setups = _.map(record.get('researchSetups'), record => _getProperties(record));
        return result;
    }
    else {
        return null;
    }
}

// get product by id
function getProductById(session, productId) {
    const query = [
    'MATCH (product:Product) WHERE product.productId = $productId',
    'OPTIONAL MATCH (lab:Lab)<-[:USED_AT]-(product)',
    'OPTIONAL MATCH (researchSetup:ResearchSetup)-[:COMPOSED_OF]->(product)',
    'OPTIONAL MATCH (researcher:Researcher)-[:USING]->(product)',
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(r:Researcher)-[:USING]->(product)',
    'WITH DISTINCT product,',
    'lab, researchSetup, researcher, researchArea',
    'RETURN COLLECT(DISTINCT product) AS product,',
    'COLLECT(DISTINCT lab) as labs,',
    'COLLECT(DISTINCT researchSetup) AS researchSetups,',
    'COLLECT(DISTINCT researcher) AS researchers,',
    'COLLECT(DISTINCT researchArea) AS researchAreas',
    ].join('\n');
    const params = { productId: productId };

    return executeQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records)) {
            return _singleProductFullInfo(result.records[0]);
        }
        else {
            throw {message: 'Product Not Found!', status: 404}
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
    getProductById: getProductById,
}