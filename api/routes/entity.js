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
const { EntityTypeNotFound, EntityIdNotFound, BadRequest, GeneralError } = require('../utils/errors');


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
        throw new EntityTypeNotFound(relatioship);
    }
    return relationshipTypeFound;
};

async function _verifyEntityExists(session, entityType, entityIdField, entityIdValue) {
    const entity = entityType.toLowerCase();
    const query = [
        'MATCH (' + entity + ': ' + entityType + ')',
        'WHERE ' + entity + '.' + entityIdField + ' = $entityId', 
        'RETURN count(' + entity + ')=1 as exists'
    ].join('\n');
    const params = { entityId: entityIdValue };

    const result = await session.run(query, params);
    if (!_.isEmpty(result.records)) {
        return result.records[0].get('exists')
    }
}

async function _validatePropertiesObject(req, res, reqBody) {
    const entityType = _getEntityType(reqBody['entityType']);
    if (entityType.toLowerCase() != req.params.entity) {
        throw new BadRequest('Request bodys entity type does not match route entity type!');  
    }

    const entityId = reqBody['entityId'];
    if (entityId != req.params.id) {
        throw new BadRequest('Request bodys entity id does not match route entity id!');
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
            break;
        default:
            throw new BadRequest('Unknown request object: ' + reqObject);
    }
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
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
 * get all pre-defined entity types
 * @param {*} req client's request
 * @param {*} res server's response
 * @returns all pre-defined entity types
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
    })    
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function addEntityRelationship(req, res, next) {
    const reqBody = _validateRequestBody(req, res, next);
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

    return executeCypherQuery(session, finalQuery, {}, 'WRITE')
    .then(result => validateRelationShipsCreated(result, Object.keys(relationships).length))
    .then(response => {
        writeResponse(res, response);
    })
    .catch(error => {
        session.close();
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