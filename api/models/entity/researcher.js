const _ = require('lodash');

const databaseHandler = require('../../middleware/graphDBHandler');
const executeQuery = databaseHandler.executeCypherQuery;
const validateResponse = databaseHandler.validateDatabaseGetByIdResponse;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;


const { EntityIdNotFound } = require("../../utils/errors");

function _getResearcherPageInfo(records) {
    if (records.length > 0) {
        var result = {};
        result["Entity"] = getAllNodesByFieldKey(records, 'researcher', true);
        result["Member Of Labs"] = getAllNodesByFieldKey(records, 'labs');
        result["Areas of Research"] = getAllNodesByFieldKey(records, 'researchAreas');
        result["Active Researches"] = getAllNodesByFieldKey(records, 'researches');
        result["Published Articles"] = getAllNodesByFieldKey(records, 'articles');
        result["Purchased Products"] = getAllNodesByFieldKey(records, 'purchasedProducts');
        result["Shared Products"] = getAllNodesByFieldKey(records, 'sharedProducts');
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
                'edgeName': 'ACTIVE_AT',
                'listOfEntities': [
                    {
                        'listName': 'onResearchAreas',
                        'entity': 'ResearchArea'
                    }
                ]
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
    'OPTIONAL MATCH (lab:Lab)<-[:ACTIVE_AT]-(researcher)',
    'OPTIONAL MATCH (researchArea:ResearchArea)<-[:RESEARCHES]-(researcher)',
    'OPTIONAL MATCH (research:Research)<-[:CONDUCTS]-(researcher)',
    'OPTIONAL MATCH (article:Article)-[:WROTE_REGARD_TO]->(r:Research)<-[:CONDUCTS]-(researcher)',
    'OPTIONAL MATCH (purchasedProduct:Product)<-[:USING {isOwner: "true"}]-(researcher)',
    'OPTIONAL MATCH (sharedProduct:Product)<-[:USING {isOwner: "false"}]-(researcher)',     
    'WITH DISTINCT researcher,',
    'lab, researchArea, research, article, purchasedProduct, sharedProduct',
    'RETURN COLLECT(DISTINCT researcher) AS researcher,',
    'COLLECT(DISTINCT lab)[0..20] AS labs,',
    'COLLECT(DISTINCT researchArea)[0..20] AS researchAreas,',
    'COLLECT(DISTINCT research)[0..20] AS researches,',
    'COLLECT(DISTINCT article)[0..20] AS articles,',
    'COLLECT(DISTINCT purchasedProduct)[0..20] AS purchasedProducts,',
    'COLLECT(DISTINCT sharedProduct)[0..20] AS sharedProducts',
    ].join('\n');
    const params = { researcherId: researcherId };

    return executeQuery(session, query, params)
    .then(response => {
        if (validateResponse(response)) {
            return _getResearcherPageInfo(response.records);
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