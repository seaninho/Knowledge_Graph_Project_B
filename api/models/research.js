const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResult = databaseHandler.validateResult;
const getEntityList = databaseHandler.getAllRecordsByKey;
const getEntityProperties = databaseHandler.getRecordPropertiesByLabel;

const { EntityIdNotFound } = require("../utils/errors");

function _getResearchPageInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getEntityProperties(record, 'research');
        result["Researchers"] = getEntityList(record, 'researchers');
        result["Areas of Research"] = getEntityList(record, 'researchAreas');
        result["Research Setup Used"] = getEntityList(record, 'researchSetups');
        result["Articles Published"] = getEntityList(record, 'articles');
        return result;
    }
    else {
        return null;
    }
}

// get research scheme ("recipe")
function getScheme() {
    return {
        'entity': 'Research',
        'id': 'researchId',
        'name': 'researchName',
        'property': [],
        'edges': [
            {
                'src': 'Researcher',
                'dst': 'Research',
                'edgeName': 'CONDUCTS'
            },
            {
                'src': 'Research',
                'dst': 'ResearchArea',
                'edgeName': 'RELEVANT_TO'
            },
            {
                'src': 'ResearchSetup',
                'dst': 'Research',
                'edgeName': 'USED_IN'
            },
            {
                'src': 'Article',
                'dst': 'Research',
                'edgeName': 'WROTE_REGARD_TO'
            }
        ]
    };
};

// get research by id
function getResearchById(session, researchId, next) {
    const query = [
    'MATCH (research:Research) WHERE research.researchId = $researchId',
    'OPTIONAL MATCH (researcher:Researcher)-[:CONDUCTS]->(research)',  
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(r:Researcher)-[:CONDUCTS]->(research)',  
    'OPTIONAL MATCH (researchSetup:ResearchSetup)-[:USED_IN]->(research)',
    'OPTIONAL MATCH (article:Article)-[:WROTE_REGARD_TO]->(research)',    
    'WITH DISTINCT research,',
    'researcher, researchArea, researchSetup, article',
    'RETURN COLLECT(DISTINCT research) AS research,',
    'COLLECT(DISTINCT researcher) as researchers,',
    'COLLECT(DISTINCT researchArea) AS researchAreas,',
    'COLLECT(DISTINCT researchSetup) AS researchSetups,',
    'COLLECT(DISTINCT article) AS articles',
    ].join('\n');
    const params = { researchId: researchId };

    return executeQuery(session, query, params)
    .then(result => {
        if (validateResult(result)) {
            return _getResearchPageInfo(result.records[0]);
        }
        else {
            throw new EntityIdNotFound('Research', researchId);
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
    getResearchById: getResearchById
}