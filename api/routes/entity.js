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
 * verify entity exists
 * @param {*} session neo4j session
 * @param {*} entityType entity's type
 * @param {*} entityIdField entity's id field according to entity's scheme
 * @param {*} entityIdValue entity's id
 * @returns true if entity exists; false otherwise.
 */
async function _verifyEntityExists(session, entityType, entityIdField, entityIdValue) {
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
    const exists = await _verifyEntityExists(session, entityType, entityScheme['id'], entityId);
    if (exists !== true) {
        session.close();
        throw new EntityIdNotFound(entityType, entityId);
    }    

    const properties = reqBody['properties'];
    for (const [property, _value] of Object.entries(properties)) {
        if (property != entityScheme['name'] && 
            !entityScheme['property'].includes(property)) {
            throw new BadRequest('Unknown request property in request body \'properties\''); 
        }
    }
}

/**
 * verify relationship exists
 * @param {*} session neo4j session
 * @param {*} srcEntityType source entity's type
 * @param {*} dstEntityType destination entity's type
 * @param {*} relationshipType relationship type
 * @param {*} srcEntityIdField source entity's id field according to entity's scheme
 * @param {*} dstEntityIdField destination entity's id field according to entity's scheme
 * @param {*} srcEntityIdValue source entity's id
 * @param {*} dstEntityIdValue destination entity's id
 * @returns true if relationship exists; false otherwise.
 */
async function _verifyRelationshipExists(session, srcEntityType, dstEntityType,
    relationshipType, srcEntityIdField, dstEntityIdField, srcEntityIdValue, dstEntityIdValue) {
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
 * validate request body relationships object
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} reqBody request body
 */
async function _validateRelationshipsObject(req, res, reqBody) {
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
    for (srcEdge of srcEdges) {
        if (srcEdge['edgeName'] === relationshipType) {
            if (srcEdge['src'] !== srcEntityType || srcEdge['dst'] !== dstEntityType) {
                throw new BadRequest('Each relationship is uni-directional! ' + 
                    '[entity types for source and destionation in reuest body does not match relationship model]');
            }
            break;
        }
    }


    var srcEntityId, srcExists, dstEntityId, dstExists, relationshipExist;
    for (edge of edges) {
        srcEntityId = edge['src'];
        dstEntityId = edge['dst'];
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

        srcExists = await _verifyEntityExists(getSession(req, true), srcEntityType, 
            srcEntityScheme['id'], srcEntityId);
        if (srcExists !== true) {
            throw new EntityIdNotFound(srcEntityType, srcEntityId);
        }        
        dstExists = await _verifyEntityExists(getSession(req, true), dstEntityType, 
            dstEntityScheme['id'], dstEntityId);
        if (dstExists !== true) {
            throw new EntityIdNotFound(dstEntityType, dstEntityId);
        }

        relationshipExist = await _verifyRelationshipExists(getSession(req, true), 
            srcEntityType, dstEntityType, relationshipType, srcEntityScheme['id'], 
            dstEntityScheme['id'], srcEntityId, dstEntityId);
        if (relationshipExist === true) {
            throw new RelationshoipAlreadyExists(srcEntityType, dstEntityType, 
                relationshipType, srcEntityId, dstEntityId);
        }
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
        case 'properties':
            return await _validatePropertiesObject(req, res, reqBody);            
        case 'entity':
            break;
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
            return getAllNodesByFieldKey(result.records[0], entity);
        }
    })
    .then(response => writeResponse(res, response))
    .catch(error => {
        session.close();
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
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function addEntityRelationship(req, res, next) {
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
        const relationships = reqBody['edges'];
        relationships.forEach((relationship) => {
            addEdgeQuery = 
            [
                'MATCH (src:' + srcEntityType + '), ' + '(dst:' + dstEntityType + ')',
                'WHERE src.' + srcEntityScheme['id'] + ' = ' + '\'' + relationship['src'] + '\' ' + 
                'AND dst.' + dstEntityScheme['id'] + ' = ' + '\'' + relationship['dst'] + '\'',
                'CREATE (src)-[:' + relationshipType + ']->(dst)'
            ].join('\n');

            if (relationships.indexOf(relationship) != relationships.length - 1) {
                addEdgeQuery += '\nUNION\n';
            }
            finalQuery += addEdgeQuery;
        });
        
        try {
            const result = await executeCypherQuery(session, finalQuery, {}, 'WRITE');
            const response = validateRelationShipsCreated(result, Object.keys(relationships).length);
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
    setEntityProperties: setEntityProperties,
    addEntityRelationship: addEntityRelationship
}