const _ = require('lodash');
const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const getEntityList = databaseHandler.getEntityListByRecordKey;
const getEntityProperties = databaseHandler.getEntityPropertiesByLabel;

function _singleProductFullInfo(record) {
    if (record.length > 0) {
        var result = {};
        var recommendations = {};
        result["Entity"] = getEntityProperties(record, 'product');
        result["Labs That Use This Product"] = getEntityList(record, 'labs');
        result["Research Areas That Use This Product"] = getEntityList(record, 'researchAreas');
        result["Researches That Use This Product"] = getEntityList(record, 'researches');
        result["Owned By This Researcher"] = getEntityList(record, 'owner');
        result["Researchers That Use This Product"] = getEntityList(record, 'researchers');
        result["Part of This Research Setup"] = getEntityList(record, 'researchSetups');        
        recommendations["Other Products Purchase By Owner"] = getEntityList(record, 'otherProducts');
        recommendations["Other Products Used At The Same Lab"] = getEntityList(record, 'labCommonProducts');
        recommendations["Other Products Used In The Same Research Area"] = getEntityList(record, 'raCommonProducts');
        result["recommendations"] = recommendations;
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