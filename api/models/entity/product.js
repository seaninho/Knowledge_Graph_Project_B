const _ = require('lodash');

const databaseHandler = require('../../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;


const { EntityIdNotFound } = require("../../utils/errors");

function _getProductPageInfo(records) {
    if (records.length > 0) {
        var result = {};
        var recommendations = {};
        result["Entity"] = getAllNodesByFieldKey(records, 'product', true);
        result["Labs That Use This Product"] = getAllNodesByFieldKey(records, 'labs');
        result["Research Areas That Use This Product"] = getAllNodesByFieldKey(records, 'researchAreas');
        result["Researches That Use This Product"] = getAllNodesByFieldKey(records, 'researches');
        result["Owned By This Researcher"] = getAllNodesByFieldKey(records, 'owner');
        result["Researchers That Use This Product"] = getAllNodesByFieldKey(records, 'researchers');
        result["Part of This Research Setup"] = getAllNodesByFieldKey(records, 'researchSetups');        
        recommendations["Other Products Purchase By Owner"] = getAllNodesByFieldKey(records, 'otherProducts');
        recommendations["Other Products Used At The Same Lab"] = getAllNodesByFieldKey(records, 'labCommonProducts');
        recommendations["Other Products Used In The Same Research Area"] = getAllNodesByFieldKey(records, 'raCommonProducts');
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
    'COLLECT(DISTINCT lab)[0..20] AS labs,',
    'COLLECT(DISTINCT researchSetup)[0..20] AS researchSetups,',
    'COLLECT(DISTINCT research)[0..20] AS researches,',
    'COLLECT(DISTINCT owner)[0..20] AS owner,',
    'COLLECT(DISTINCT researcher)[0..20] AS researchers,',
    'COLLECT(DISTINCT researchArea)[0..20] AS researchAreas,',
    'COLLECT(DISTINCT otherProduct)[0..20] AS otherProducts,',
    'COLLECT(DISTINCT labCommonProduct)[0..20] AS labCommonProducts,',
    'COLLECT(DISTINCT raCommonProduct)[0..20] AS raCommonProducts',
    ].join('\n');
    const params = { productId: productId };

    return executeQuery(session, query, params)
    .then(response => {
        if (validateResponse(response)) {
            return _getProductPageInfo(response.records);
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