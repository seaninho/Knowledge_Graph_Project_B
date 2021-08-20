const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;

function _getProperties(record) {
    return record.properties;
}

function _singleProductFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Product Information"] = _.map(record.get('product'), record => _getProperties(record));
        result["Labs That Use This Product"] = _.map(record.get('labs'), record => _getProperties(record));
        result["Research Areas That Use This Product"] = _.map(record.get('researchAreas'), record => _getProperties(record));
        result["Researches That Use This Product"] = _.map(record.get('researches'), record => _getProperties(record));
        result["Owned By This Researcher"] = _.map(record.get('owner'), record => _getProperties(record));
        result["Researchers That Use This Product"] = _.map(record.get('researchers'), record => _getProperties(record));
        result["Part of This Research Setup"] = _.map(record.get('researchSetups'), record => _getProperties(record));
        result["Other Products Purchase By Owner"] = _.map(record.get('otherProducts'), record => _getProperties(record));
        result["Other Products Used At The Same Lab"] = _.map(record.get('labCommonProducts'), record => _getProperties(record));
        result["Other Products Used In The Same Research Area"] = _.map(record.get('raCommonProducts'), record => _getProperties(record));
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
    'OPTIONAL MATCH (research:Research)<-[:USED_IN]-(rS:ResearchSetup)-[:COMPOSED_OF]->(product)',
    'OPTIONAL MATCH (owner:Researcher)-[:USING {isOwner: "TRUE"}]->(product)',
    'OPTIONAL MATCH (researcher:Researcher)-[:USING]->(product)',     
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(:Researcher)-[:USING]->(product)',
    'OPTIONAL MATCH (otherProduct:Product)<-[:USING]-(:Researcher)-[:USING {isOwner: "TRUE"}]->(product)',
    'OPTIONAL MATCH (labCommonProduct:Product)-[:USED_AT]->(:Lab)<-[:USED_AT]-(product)',
    'OPTIONAL MATCH (raCommonProduct)<-[:USING]-(:Researcher)-[:RESEARCHES]->(:ResearchArea)<-[:RESEARCHES]-(:Researcher)-[:USING]->(product)',
    'WITH DISTINCT product,',
    'lab, researchSetup, research, owner, researcher, researchArea, ',
    'otherProduct, labCommonProduct, raCommonProduct',
    'RETURN COLLECT(DISTINCT product) AS product,',
    'COLLECT(DISTINCT lab) as labs,',
    'COLLECT(DISTINCT researchSetup) AS researchSetups,',
    'COLLECT(DISTINCT research) AS researches,',
    'COLLECT(DISTINCT owner) AS owner,',
    'COLLECT(DISTINCT researcher) AS researchers,',
    'COLLECT(DISTINCT researchArea) AS researchAreas,',
    'COLLECT(DISTINCT otherProduct) AS otherProducts,',
    'COLLECT(DISTINCT labCommonProduct) AS labCommonProducts,',
    'COLLECT(DISTINCT raCommonProduct) AS raCommonProducts',
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