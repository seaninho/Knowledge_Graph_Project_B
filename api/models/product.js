const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;


const { EntityIdNotFound } = require("../utils/errors");

function _getProductPageInfo(record) {
    if (record.length > 0) {
        var result = {};
        var recommendations = {};
        result["Entity"] = getAllNodesByFieldKey(record, 'product', true);
        result["Labs That Use This Product"] = getAllNodesByFieldKey(record, 'labs');
        result["Research Areas That Use This Product"] = getAllNodesByFieldKey(record, 'researchAreas');
        result["Researches That Use This Product"] = getAllNodesByFieldKey(record, 'researches');
        result["Owned By This Researcher"] = getAllNodesByFieldKey(record, 'owner');
        result["Researchers That Use This Product"] = getAllNodesByFieldKey(record, 'researchers');
        result["Part of This Research Setup"] = getAllNodesByFieldKey(record, 'researchSetups');        
        recommendations["Other Products Purchase By Owner"] = getAllNodesByFieldKey(record, 'otherProducts');
        recommendations["Other Products Used At The Same Lab"] = getAllNodesByFieldKey(record, 'labCommonProducts');
        recommendations["Other Products Used In The Same Research Area"] = getAllNodesByFieldKey(record, 'raCommonProducts');
        result["recommendations"] = recommendations;
        return result;
    }
    else {
        return null;
    }
}

// get product scheme ("recipe")
function getScheme() {
    return {
        'entity': 'Product',
        'id': 'productId',
        'name': 'productDescription',
        'activeField': 'isActiveProduct',
        'property': [
            'deviceId', 
            'productDateCreated', 
            'productManufacture', 
            'endOfManufactureWarrenty'
        ],        
        'edges': [
            {
                'src': 'Product',
                'dst': 'Lab',
                'edgeName': 'USED_AT'
            },
            {
                'src': 'Researcher',
                'dst': 'Product',
                'edgeName': 'USING'
            },
            {
                'src': 'ResearchSetup',
                'dst': 'Product',
                'edgeName': 'COMPOSED_OF'
            },
        ]
    };
};

// get product by id
function getProductById(session, productId, next) {
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
    .then(response => {
        if (validateResponse(response)) {
            return _getProductPageInfo(response.records[0]);
        }
        else {
            throw new EntityIdNotFound('Product', productId);
        }
    })
    .catch(error => {      
      session.close();
      next(error);
    });
};

// exported functions
module.exports = {
    getScheme: getScheme,
    getProductById: getProductById
}