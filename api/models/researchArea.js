const _ = require('lodash');

const databaseHandler = require('../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResult = databaseHandler.validateResult;
const getEntityList = databaseHandler.getAllRecordsByKey;
const getEntityProperties = databaseHandler.getRecordPropertiesByLabel;

const { EntityIdNotFound } = require("../utils/errors");

function _getResearchAreaPageInfo(record) {
    if (record.length > 0) {
        var result = {};
        result["Entity"] = getEntityProperties(record, 'researchArea');
        result["Researched In Labs"] = getEntityList(record, 'labs');
        result["Researches In This Area"] = getEntityList(record, 'researches');
        result["Researchers In This Area"] = getEntityList(record, 'researchers');
        result["Products Used In This Area"] = getEntityList(record, 'products');       
        return result;
    }
    else {
        return null;
    }
}

// get research area scheme ("recipe")
function getScheme() {
    return {
        'entity': 'ResearchArea',
        'id': 'researchAreaId',
        'name': 'researchAreaName',
        'property': [],
        'edges': [
            {
                'src': 'ResearchArea',
                'dst': 'Lab',
                'edgeName': 'WAS_RESEARCHED_AT'
            },
            {
                'src': 'Researcher',
                'dst': 'ResearchArea',
                'edgeName': 'RESEARCHES'
            },
            {
                'src': 'Research',
                'dst': 'ResearchArea',
                'edgeName': 'RELEVANT_TO'
            }
        ]
    };
}

// get research area by id
function getResearchAreaById(session, researchAreaId, next) {
    const query = [
    'MATCH (researchArea:ResearchArea) WHERE researchArea.researchAreaId = $researchAreaId',    
    'OPTIONAL MATCH (research:Research)-[:RELEVANT_TO]->(researchArea)',
    'OPTIONAL MATCH (researcher:Researcher)-[:RESEARCHES]->(researchArea)',    
    'OPTIONAL MATCH (product:Product)<-[:USING]-(r:Researcher)-[:RESEARCHES]->(researchArea)',
    'OPTIONAL MATCH (lab:Lab)<-[:HAS_ACTIVE_PROJECT]-(rr:Researcher)-[:RESEARCHES]->(researchArea)',
    'WITH DISTINCT researchArea,',
    'research, researcher, product, lab',
    'RETURN COLLECT(DISTINCT researchArea) AS researchArea,',
    'COLLECT(DISTINCT research) AS researches,',
    'COLLECT(DISTINCT researcher) AS researchers,',
    'COLLECT(DISTINCT product) AS products,',
    'COLLECT(DISTINCT lab) AS labs',
    ].join('\n');
    const params = { researchAreaId: researchAreaId };

    return executeQuery(session, query, params)
    .then(result => {
        if (validateResult(result)) {
            return _getResearchAreaPageInfo(result.records[0]);
        }
        else {
            throw new EntityIdNotFound('ResearchArea', researchAreaId);
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
    getResearchAreaById: getResearchAreaById
}