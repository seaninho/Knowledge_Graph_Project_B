const _ = require('lodash');

const Article = require('../models/article');
const Faculty = require('../models/faculty');
const Lab = require('../models/lab');
const Research = require('../models/research');
const ResearchArea = require('../models/researchArea');
const Researcher = require('../models/researcher');
const ResearchSetup = require('../models/researchSetup');
const Product = require('../models/product');

const databaseHandler = require('../middleware/graphDBHandler');
const getSession = databaseHandler.getSession;
const executeCypherQuery = databaseHandler.executeCypherQuery;
const getAllNodesByFieldKey = databaseHandler.getAllNodesByFieldKey;
const validatePropertiesSet = databaseHandler.validatePropertiesSet;
const validateRelationShipsCreated = databaseHandler.validateRelationShipsCreated;
const responseHandler = require('../helpers/response');
const writeResponse = responseHandler.writeResponse;
const { GeneralError, BadRequest, EntityTypeNotFound, EntityIdNotFound, 
    EntityHasNoSuchRelationship, RelationshipTypeNotFound, RelationshoipAlreadyExists } = require('../utils/errors');


const entityTypes = 
[
    'Article', 
    'Faculty', 
    'Lab', 
    'Product', 
    'Research', 
    'ResearchArea', 
    'Researcher', 
    'ResearchSetup'
];

const relationshipTypes = 
[
    'PART_OF',
    'ACTIVE_AT',
    'USING',
    'RESEARCHES',
    'CONDUCTS',
    'WAS_RESEARCHED_AT',
    'USED_AT',
    'COMPOSED_OF',
    'USED_IN',
    'RELEVANT_TO',
    'WROTE_REGARD_TO'
];

/**
 * get a pre-defined entity type matching 'entity' parameter
 * @param {*} entity entity to match
 * @returns entity in upper-case if 'entity' parameter matches one of the 
 * pre-defined entity types. Otherwise, throws EntityNotFound exception.
 */
function _getEntityType(entity) {
    const entityTypeFound = entityTypes.find((entityType) => 
        entityType.toLowerCase() == entity.toLowerCase());
    if (!entityTypes.includes(entityTypeFound)) {
        throw new EntityTypeNotFound(entity);
    }
    return entityTypeFound;
};

/**
 * get a pre-defined relationship type matching 'relationship' parameter
 * @param {*} relatioship relationship to match
 * @returns relationship in upper-case if 'relationship' parameter matches one of the 
 * pre-defined relationship types. Otherwise, throws RelationshipNotFound exception.
 */
function _getRelationshipType(relatioship) {
    const relationshipTypeFound = relationshipTypes.find((relationshipType) => 
        relationshipType.toUpperCase() == relatioship.toUpperCase());
    if (!relationshipTypes.includes(relationshipTypeFound)) {
        throw new RelationshipTypeNotFound(relatioship);
    }
    return relationshipTypeFound;
};

/**
 * get max id used for entity type
 * @param {*} session neo4j session
 * @param {*} entityType entity's type
 * @param {*} entityIdField entity's id field according to entity's scheme
 * @returns largest id used by an entity of type entityType in graph
 */
async function _getMaxIdForEntityType(session, entityType, entityIdField) {
    const entity = entityType.toLowerCase();
    const query = [
        'MATCH (' + entity + ':' + entityType + ')',                 
        'RETURN max(toInteger(' + entity + '.' + entityIdField + ')) AS maxId'
    ].join('\n');
    const params = {};
    
    const result = await executeCypherQuery(session, query, params);    
    if (!_.isEmpty(result.records)) {
        return result.records[0].get('maxId');
    }
}

/**
 * validate request body search object
 * @param {*} req client's request
 * @param {*} reqBody request body
 */
async function _validateSearchObject(req, reqBody) {
    const entityType = _getEntityType(reqBody['entityType']);
    if (entityType.toLowerCase() != req.params.entity) {
        throw new BadRequest('Request body entity type does not match route\'s entity type!');  
    }

    const searchQuery = reqBody['searchQuery'];
    if (searchQuery == null) {
        throw new BadRequest('Request body has no search query!');
    }
}

/**
 * verify entity exists
 * @param {*} session neo4j session
 * @param {*} entityIdProfile entity's id profile (type, id field, id value)
 * @returns true if entity exists; false otherwise.
 */
async function _verifyEntityExists(session, entityIdProfile) {
    const [entityType, entityIdField, entityIdValue] = entityIdProfile;
    const entity = entityType.toLowerCase();
    const query = [
        'MATCH (' + entity + ':' + entityType + ')',        
        'WHERE ' + entity + '.' + entityIdField + ' = ' + '\'' + entityIdValue +'\'', 
        'RETURN count(' + entity + ')=1 AS exists'
    ].join('\n');
    const params = {};
    
    const result = await executeCypherQuery(session, query, params);    
    if (!_.isEmpty(result.records)) {
        return result.records[0].get('exists')
    }
}

/**
 * validate request body properties
 * @param {*} reqBody request body
 * @param {*} entityScheme entity's scheme to validate against
 * @throws {*} 
 */
function _validateEntityProperties(reqBody, entityScheme) {
    const properties = reqBody['properties'];
    for (const [property, _value] of Object.entries(properties)) {
        if (property != entityScheme['name'] && 
            !entityScheme['property'].includes(property)) {
            throw new BadRequest('Unknown request property in request body \'properties\': \'' + property +'\''); 
        }
    }
}

/**
 * validate request body properties object
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} reqBody request body
 */
async function _validatePropertiesObject(req, res, reqBody) {
    const entityType = _getEntityType(reqBody['entityType']);
    if (entityType.toLowerCase() != req.params.entity) {
        throw new BadRequest('Request body entity type does not match route\'s entity type!');  
    }

    const entityId = reqBody['entityId'];
    if (entityId != req.params.id) {
        throw new BadRequest('Request body entity id does not match route\'s entity id!');
    }

    const session = getSession(req);
    const entityScheme = getScheme(req, res, false);
    const entityIdProfile = [entityType, entityScheme['id'], entityId];
    const exists = await _verifyEntityExists(session, entityIdProfile);
    if (exists !== true) {
        session.close();
        throw new EntityIdNotFound(entityType, entityId);
    }    

    _validateEntityProperties(reqBody, entityScheme);
}

/**
 * verify relationship exists
 * @param {*} session neo4j session
 * @param {*} srcEntityIdProfile source entity's id profile (type, id field, id value)
 * @param {*} dstEntityIdProfile destination entity's id profile (type, id field, id value)
 * @param {*} relationshipType relationship type 
 * @returns true if relationship exists; false otherwise.
 */
async function _verifyRelationshipExists(session, srcEntityIdProfile, 
    dstEntityIdProfile, relationshipType) {
    const [srcEntityType, srcEntityIdField, srcEntityIdValue] = srcEntityIdProfile;
    const [dstEntityType, dstEntityIdField, dstEntityIdValue] = dstEntityIdProfile;
    const query = [         
        'RETURN EXISTS',
        '( (:' + srcEntityType + ' {' + srcEntityIdField + ': \'' + srcEntityIdValue +'\'})',
        '-[:' + relationshipType + ']->',
        '(:' + dstEntityType + ' {' + dstEntityIdField + ': \'' + dstEntityIdValue +'\'}) )',
        'AS exists'
    ].join('');
    const params = {};

    const result = await executeCypherQuery(session, query, params);    
    if (!_.isEmpty(result.records)) {
        return(result.records[0].get('exists'));
    }
}

/**
 * validate request body edges for a existing entities
 * @param {*} req client's request
 * @param {*} reqBody request body
 * @param {*} typeTuple tuple containing srcEntityType, dstEntityType, relationshipType
 * @param {*} schemeTuple tuple containing srcEntityScheme, dstEntityScheme
 */
async function _validateEdgesObjectForExistingEntity(req, reqBody, typeTuple, schemeTuple) {
    const [srcEntityType, dstEntityType, relationshipType] = typeTuple;
    const [srcEntityScheme, dstEntityScheme] = schemeTuple;
    const edges = reqBody['edges'];
    var srcEntityId, srcExists, dstEntityId, dstExists, relationshipExist;
    var srcEntityIdProfile, dstEntityIdProfile;
    for (let edge of edges) {
        srcEntityId = edge['src'];
        dstEntityId = edge['dst'];
        srcEntityIdProfile = [srcEntityType, srcEntityScheme['id'], srcEntityId];
        dstEntityIdProfile = [dstEntityType, dstEntityScheme['id'], dstEntityId];

        if (srcEntityType.toLowerCase() == req.params.entity) {
            if (srcEntityId != req.params.id) {
                throw new BadRequest('Request body source entity id ' + 
                    'does not match route\'s entity id!');
            }
        } 
        else {
            if (dstEntityId != req.params.id) {
                throw new BadRequest('Request body destination entity id ' + 
                    'does not match route\'s entity id!');
            }
        }

        srcExists = await _verifyEntityExists(getSession(req, true), srcEntityIdProfile);
        if (srcExists !== true) {
            throw new EntityIdNotFound(srcEntityType, srcEntityId);
        }        
        dstExists = await _verifyEntityExists(getSession(req, true), dstEntityIdProfile);
        if (dstExists !== true) {
            throw new EntityIdNotFound(dstEntityType, dstEntityId);
        }
        
        relationshipExist = await _verifyRelationshipExists(getSession(req, true), 
            srcEntityIdProfile, dstEntityIdProfile, relationshipType);
        if (relationshipExist === true) {
            throw new RelationshoipAlreadyExists(srcEntityType, dstEntityType, 
                relationshipType, srcEntityId, dstEntityId);
        }
    }
}

/**
 * validate request body edges for a newly created entity
 * @param {*} req client's request
 * @param {*} reqBody request body
 * @param {*} typeTuple tuple containing srcEntityType, dstEntityType
 * @param {*} schemeTuple tuple containing srcEntityScheme, dstEntityScheme
 */
async function _validateEdgesObjectForNewEntity(req, reqBody, typeTuple, schemeTuple) {
    const [srcEntityType, dstEntityType, _] = typeTuple;
    const [srcEntityScheme, dstEntityScheme] = schemeTuple;
    const edges = reqBody['edges']; 
    var srcEntityId, srcExists, dstEntityId, dstExists, createdEntityIsSource;
    var srcEntityIdProfile, dstEntityIdProfile;
    for (let edge of edges) {
        srcEntityId = edge['src'];
        dstEntityId = edge['dst'];
        srcEntityIdProfile = [srcEntityType, srcEntityScheme['id'], srcEntityId];
        dstEntityIdProfile = [dstEntityType, dstEntityScheme['id'], dstEntityId];
        createdEntityIsSource = 
            req.params.entity == srcEntityType.toLowerCase() ? true : false;

        if (createdEntityIsSource) {
            if (srcEntityId != -1) {
                throw new BadRequest('Request body source entity id ' + 
                    'does not match a newly entity id!');
            }

            dstExists = await _verifyEntityExists(getSession(req, true), dstEntityIdProfile);
            if (dstExists !== true) {
                throw new EntityIdNotFound(dstEntityType, dstEntityId);
            }
        } 
        else {
            if (dstEntityId != -1) {
                throw new BadRequest('Request body destination entity id ' + 
                    'does not match a newly entity id!');
            }
            
            srcExists = await _verifyEntityExists(getSession(req, true), srcEntityIdProfile);
            if (srcExists !== true) {
                throw new EntityIdNotFound(srcEntityType, srcEntityId);
            }            
        }
    }
}

/**
 * validate request body relationships object
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} reqBody request body
 * @param {*} newlyCreated true if relationship includes a newly created entity; false otherwise.
 */
async function _validateRelationshipsObject(req, res, reqBody, newlyCreated = false) {
    const relationshipType = _getRelationshipType(reqBody['edgeName']);
    const srcEntityType = _getEntityType(reqBody['src']);
    const dstEntityType = _getEntityType(reqBody['dst']);
    
    if (srcEntityType.toLowerCase() != req.params.entity &&
        dstEntityType.toLowerCase() != req.params.entity) {
            throw new BadRequest('Request body entity type does not match route\'s entity type!');
    }
    if (srcEntityType === dstEntityType) {
        throw new BadRequest('Self-loop are not allowed! ' + 
            '[Source entity is of the same entity type as destination entity]');
    }
    
    const srcEntityScheme = getScheme(req, res, false, srcEntityType);
    if (srcEntityScheme['edges'].findIndex(edge => edge['edgeName'] === relationshipType) === -1) {
        throw new EntityHasNoSuchRelationship(srcEntityType, relationshipType);
    }
    const dstEntityScheme = getScheme(req, res, false, dstEntityType);
    if (dstEntityScheme['edges'].findIndex(edge => edge['edgeName'] === relationshipType) === -1) {
        throw new EntityHasNoSuchRelationship(srcEntityType, relationshipType);
    }

    const srcEdges = srcEntityScheme['edges'];
    for (let srcEdge of srcEdges) {
        if (srcEdge['edgeName'] === relationshipType) {
            if (srcEdge['src'] !== srcEntityType || srcEdge['dst'] !== dstEntityType) {
                throw new BadRequest('Each relationship is uni-directional! ' + 
                    '[entity types for source and destionation in request body does not match relationship model]');
            }
            break;
        }
    }

    const typeTuple = [srcEntityType, dstEntityType, relationshipType];
    const schemeTuple = [srcEntityScheme, dstEntityScheme];
    if (newlyCreated) {
        await _validateEdgesObjectForNewEntity(req, reqBody, typeTuple, schemeTuple);
    }
    else {
        await _validateEdgesObjectForExistingEntity(req, reqBody, typeTuple, schemeTuple);
    }
}

/**
 * validate request body entity object
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} reqBody request body 
 */
async function _validateEntityObject(req, res, reqBody) {
    const entityType = _getEntityType(reqBody['entityType']);
    if (entityType.toLowerCase() != req.params.entity) {
        throw new BadRequest('Request body entity type does not match route\'s entity type!');  
    }

    const entityId = reqBody['entityId'];
    if (entityId != -1) {
        throw new BadRequest('Request body entity id does not match an invalid entity id!');
    }

    const entityScheme = getScheme(req, res, false);
    _validateEntityProperties(reqBody, entityScheme);

    const relationships = reqBody['relationships'];
    for (const [_, relationshipData] of Object.entries(relationships)) {
        await _validateRelationshipsObject(req, res, relationshipData, true);
    }
}

/**
 * validate request body according to request body object
 * @param {*} req client's request
 * @param {*} res server's response
 * @returns 
 */
async function _validateRequestBody(req, res) {
    const reqBody = req.body;    
    const reqObject = reqBody['object'];
    switch (reqObject) {
        case 'search':
            return await _validateSearchObject(req, reqBody);
        case 'properties':
            return await _validatePropertiesObject(req, res, reqBody);            
        case 'entity':
            return await _validateEntityObject(req, res, reqBody);
        case 'relationships':            
            return await _validateRelationshipsObject(req, res, reqBody);
        default:
            throw new BadRequest('Unknown request object: ' + reqObject);
    }
}

/**
 * get all relationship types existing in database
 * @param {*} req client's request
 * @param {*} res server's response
 * @returns all existing relationship types
 */
function getAllRelationshipTypes(req, res, next) {
    const session = getSession(req);
    const query = [
        'MATCH (a)-[r]->(b)', 
        'RETURN DISTINCT TYPE(r)'
    ].join('\n');
    const params = {};

    return executeCypherQuery(session, query, params)
    .then(result => {        
        if (!_.isEmpty(result.records) ) {
            var relationshipTypes = [];
            result.records.forEach((record) => {
                relationshipTypes.push(record._fields[0]);
            }) 
            return relationshipTypes;
        }
    })
    .then(relationshipTypesFound => {
        relationshipTypesFound.forEach((type) => {
            if (!relationshipTypes.includes(type)) {
                throw new GeneralError('Database does not match model. ' +
                'relationship type: ' + type + ' found in database but not in model!');
            }
        })
        const response = { 'relationshipType': relationshipTypesFound };
        writeResponse(res, response);
    })
    .catch(error => {
        session.close();
        next(error);
    });
}

/**
 * get all entity types existing in database
 * @param {*} req client's request
 * @param {*} res server's response
 * @returns all existing entity types
 */
function getAllEntityTypes(req, res, next) {
    const session = getSession(req);
    const query = 'call db.labels()';
    const params = {};

    return executeCypherQuery(session, query, params)
    .then(result => {        
        if (!_.isEmpty(result.records) ) {
            var nodeLabels = [];
            result.records.forEach((record) => {
                nodeLabels.push(record._fields[0]);
            }) 
            return nodeLabels;
        }
    })
    .then(entityTypesFound => {
        entityTypesFound.forEach((type) => {
            if (!entityTypes.includes(type)) {
                throw new GeneralError('Database does not match model. ' +
                'entity type: ' + type + ' found in database but not in model!');
            }
        })
        const response = { 'entityType': entityTypesFound };
        writeResponse(res, response);
    })
    .catch(error => {
        session.close();
        next(error);
    });
}

/**
 * get entity scheme by entity type
 * @param {*} req client's request (containing entity's type)
 * @param {*} res server's response
 * @param {*} writeRes if true, write result back. else, return result object.
 * @returns requested entity's scheme
 */
function getScheme(req, res, writeRes = true, entity = '') {
    const entityType = entity == '' ? 
        _getEntityType(req.params.entity) :
        _getEntityType(entity);
    
    var entityScheme;
    switch(entityType) {
        case 'Article':
            entityScheme = Article.getScheme();
            break;
        case 'Faculty':
            entityScheme = Faculty.getScheme();
            break;
        case 'Lab':
            entityScheme = Lab.getScheme();
            break;
        case 'Research':
            entityScheme = Research.getScheme();
            break;
        case 'ResearchArea':
            entityScheme = ResearchArea.getScheme();
            break;
        case 'Researcher':
            entityScheme = Researcher.getScheme();
            break;
        case 'ResearchSetup':
            entityScheme = ResearchSetup.getScheme();    
            break;
        case 'Product':
            entityScheme = Product.getScheme();
            break;
        default:
    }
    
    return writeRes ? writeResponse(res, entityScheme) : entityScheme;
}

/**
 * get entity by entity id
 * @param {*} req client's request (containing entity's info: type, id)
 * @param {*} res server's response
 * @returns requested entity 
 */
function getEntityById(req, res, next) {
    const entityId = req.params.id;
    const entityType = _getEntityType(req.params.entity);
        
    switch(entityType) {
        case 'Article':
            return Article.getArticleById(getSession(req), entityId, next)
            .then(response => writeResponse(res, response));
        case 'Faculty':
            return Faculty.getFacultyById(getSession(req), entityId, next)
            .then(response => writeResponse(res, response));
        case 'Lab':
            return Lab.getLabById(getSession(req), entityId, next)
            .then(response => writeResponse(res, response));
        case 'Research':
            return Research.getResearchById(getSession(req), entityId, next)
            .then(response => writeResponse(res, response));
        case 'ResearchArea':
            return ResearchArea.getResearchAreaById(getSession(req), entityId, next)
            .then(response => writeResponse(res, response));
        case 'Researcher':
            return Researcher.getResearcherById(getSession(req), entityId, next)
            .then(response => writeResponse(res, response));
        case 'ResearchSetup':
            return ResearchSetup.getResearchSetupById(getSession(req), entityId, next)
            .then(response => writeResponse(res, response)); 
        case 'Product':
            return Product.getProductById(getSession(req), entityId, next)
            .then(response => writeResponse(res, response));
        default:            
            throw new EntityIdNotFound(entityType, entityId, next);
    }
}

/**
 * get all entities matching passed 'entity'
 * @param {*} req client's request (containing entity's type)
 * @param {*} res server's response
 * @param {*} next next function to execute
 * @returns 
 */
function getAllEntitiesByType(req, res, next) {
    const entity = req.params.entity.toLowerCase();
    const entityType = _getEntityType(entity);
                                
    const session = getSession(req);
    const query = [
        'MATCH (' + entity + ':' + entityType + ')',
        'RETURN COLLECT(DISTINCT ' + entity + ') AS ' + entity,    
    ].join('\n');
    const params = {};

    return executeCypherQuery(session, query, params)
    .then(result => {
        if (!_.isEmpty(result.records) && 
            !_.isEmpty(result.records[0]._fields[0])) {
            return getAllNodesByFieldKey(result.records, entity);
        }
    })
    .then(response => writeResponse(res, response))
    .catch(error => {
        session.close();
        next(error);
    });
}

/**
 * search for entity description according to request
 * @param {*} req client's request (containing entity's type)
 * @param {*} res server's response
 * @param {*} next next function to execute
 * @returns search results limited to 20 results
 */
function searchForEntity(req, res, next) {
    _validateRequestBody(req, res)
    .then(async () => {
        const reqBody = req.body;
        const entity = req.params.entity.toLowerCase();
        const entityType = _getEntityType(entity);
        const entityScheme = getScheme(req, res, false);

        const session = getSession(req);
        const entityDescField = entityScheme['name'];
        const searchQuery = reqBody['searchQuery'];
        const similarityThreshold = 0.55;
        var query = [
            'MATCH (' + entity + ':' + entityType + ')',
            'WITH DISTINCT ' + entity + ', ', 
            'apoc.text.jaroWinklerDistance(',
                'toLower('+ entity + '.' + entityDescField +'), ',
                'toLower(\'' + searchQuery + '\')',
            ') as similarity',
            'WHERE similarity >= ' + similarityThreshold,
            'RETURN ' + entity,
            'ORDER BY similarity DESC',
            'LIMIT 20'
        ].join('\n');
        
        try {
            const result = await executeCypherQuery(session, query, {});
            const response = getAllNodesByFieldKey(result.records, entity);
            return writeResponse(res, response);
        } catch (error) {
            session.close();
            throw error;
        }
    })
    .catch(error => {
        next(error);
    });
}

/**
 * set entity properties according to request
 * @param {*} req client's request (containing entity's info: type, id)
 * @param {*} res server's response
 * @param {*} next next function to execute
 * @returns if successful, 
 * a message notifing the client of successfully setting desired properties.
 * if not, throws an exception notifing the client of failure.
 */
function setEntityProperties(req, res, next) {
    _validateRequestBody(req, res)
    .then(async () => {
        const reqBody = req.body;
        const entity = req.params.entity.toLowerCase();
        const entityType = _getEntityType(entity);
        const entityId = req.params.id;
        const entityScheme = getScheme(req, res, false);
        
        const session = getSession(req);
        var query = [
            'MATCH (' + entity + ':' + entityType + ')',
            'WHERE ' + entity + '.' + entityScheme['id'] + ' = ' + '\'' + entityId + '\''           
        ].join('\n');

        const properties = reqBody['properties'];    
        for (const [property, value] of Object.entries(properties)) {
            query += '\n' + 'SET ' + entity + '.' + property + ' = ' + '\'' + value + '\'';
        }
        
        try {
            const result = await executeCypherQuery(session, query, {}, 'WRITE');
            const response = validatePropertiesSet(result, Object.keys(properties).length);
            return writeResponse(res, response);
        } catch (error) {
            session.close();
            throw error;
        }
    })
    .catch(error => {
        next(error);
    });    
}

/**
 * add entity relationships according to request
 * @param {*} req client's request (containing entity's type)
 * @param {*} res server's response
 * @param {*} next next function to execute
 * @returns if successful, 
 * a message notifing the client of successfully adding desired relationships.
 * if not, throws an exception notifing the client of failure.
 */
function addEntityRelationships(req, res, next) {
    _validateRequestBody(req, res)
    .then(async () => {
        const reqBody = req.body;
        const relationshipType = _getRelationshipType(reqBody['edgeName']);
        const srcEntityType = _getEntityType(reqBody['src']);
        const dstEntityType = _getEntityType(reqBody['dst']);    
        const srcEntityScheme = getScheme(req, res, false, srcEntityType);
        const dstEntityScheme = getScheme(req, res, false, dstEntityType);
        
        const session = getSession(req);
        var finalQuery = [];
        var addEdgeQuery;
        const edges = reqBody['edges'];
        edges.forEach((edge) => {   // each edge constitutes a relationship
            addEdgeQuery = 
            [
                'MATCH (src:' + srcEntityType + '), ' + '(dst:' + dstEntityType + ')',
                'WHERE src.' + srcEntityScheme['id'] + ' = ' + '\'' + edge['src'] + '\' ' + 
                'AND dst.' + dstEntityScheme['id'] + ' = ' + '\'' + edge['dst'] + '\'',
                'CREATE (src)-[:' + relationshipType + ']->(dst)'
            ].join('\n');

            if (edges.indexOf(edge) != edges.length - 1) {
                addEdgeQuery += '\nUNION\n';
            }
            finalQuery += addEdgeQuery;
        });
        
        try {
            const result = await executeCypherQuery(session, finalQuery, {}, 'WRITE');
            const response = validateRelationShipsCreated(result, Object.keys(edges).length);
            writeResponse(res, response);
        } catch (error) {
            session.close();
            throw error;
        }
    })
    .catch(error => {
        next(error);
    });
}


module.exports = {
    getAllEntityTypes: getAllEntityTypes,
    getAllRelationshipTypes: getAllRelationshipTypes,
    getScheme: getScheme,
    getEntityById: getEntityById,
    getAllEntitiesByType: getAllEntitiesByType,
    searchForEntity: searchForEntity,
    setEntityProperties: setEntityProperties,
    addEntityRelationship: addEntityRelationships
}