const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getEntityList = databaseHandler.getAllRecordsByKey;
const getEntityProperties = databaseHandler.getRecordPropertiesByLabel;

const { EntityIdNotFound } = require("../utils/errors");

function _getResearcherPageInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getEntityProperties(record, 'researcher');
        result["Member Of Labs"] = getEntityList(record, 'labs');
        result["Areas of Research"] = getEntityList(record, 'researchAreas');
        result["Active Researches"] = getEntityList(record, 'researches');
        result["Published Articles"] = getEntityList(record, 'articles');
        result["Purchased Products"] = getEntityList(record, 'purchasedProducts');
        result["Shared Products"] = getEntityList(record, 'sharedProducts');
        return result;
    }
    else {
        return null;
    }
}

// get researcher scheme ("recipe")
function getScheme() {
    return {
        'entity': 'Researcher',
        'id': 'researcherId',
        'name': 'researcherName',
        'property': [],
        'edges': [
            {
                'src': 'Researcher',
                'dst': 'Product',
                'edgeName': 'USING'
            },
            {
                'src': 'Researcher',
                'dst': 'ResearchArea',
                'edgeName': 'RESEARCHES'
            },
            {
                'src': 'Researcher',
                'dst': 'Lab',
                'edgeName': 'ACTIVE_AT'
            },
            {
                'src': 'Researcher',
                'dst': 'Research',
                'edgeName': 'CONDUCTS'
            }
        ]
    };
};

// get researcher by id
function getResearcherById(session, researcherId, next) {
    const query = [
    'MATCH (researcher:Researcher) WHERE researcher.researcherId = $researcherId',
    'OPTIONAL MATCH (lab:Lab)<-[:HAS_ACTIVE_PROJECT]-(researcher)',
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(researcher)',
    'OPTIONAL MATCH (research:Research)<-[:CONDUCTS]-(researcher)',
    'OPTIONAL MATCH (article:Article)-[:WROTE_REGARD_TO]->(r:Research)<-[:CONDUCTS]-(researcher)',
    'OPTIONAL MATCH (purchasedProduct:Product)<-[:USING {isOwner: "TRUE"}]-(researcher)',
    'OPTIONAL MATCH (sharedProduct:Product)<-[:USING {isOwner: "FALSE"}]-(researcher)',     
    'WITH DISTINCT researcher,',
    'lab, researchArea, research, article, purchasedProduct, sharedProduct',
    'RETURN COLLECT(DISTINCT researcher) AS researcher,',
    'COLLECT(DISTINCT lab) AS labs,',
    'COLLECT(DISTINCT researchArea) AS researchAreas,',
    'COLLECT(DISTINCT research) as researches,',
    'COLLECT(DISTINCT article) as articles,',
    'COLLECT(DISTINCT purchasedProduct) AS purchasedProducts,',
    'COLLECT(DISTINCT sharedProduct) AS sharedProducts',
    ].join('\n');
    const params = { researcherId: researcherId };

    return executeQuery(session, query, params)
    .then(response => {
        if (validateResponse(response)) {
            return _getResearcherPageInfo(response.records[0]);
        }
        else {
            throw new EntityIdNotFound('Researcher', researcherId);
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
    getResearcherById: getResearcherById
}