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
const getAllRecords = databaseHandler.getAllRecordsByKey;
const validatePropertiesSet = databaseHandler.validatePropertiesSet;
const responseHandler = require('../helpers/response');
const writeResponse = responseHandler.writeResponse;
const { EntityTypeNotFound, EntityIdNotFound, BadRequest } = require('../utils/errors');

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

/**
 * get case matched pre-defined entity type
 * @param {*} entity 
 * @throws GeneralError if 'entity' is not a valid entity type
 */
function _getEntityType(entity) {
    const entityTypeFound = entityTypes.find((entityType) => 
        entityType.toLowerCase() == entity.toLowerCase())
    if (!entityTypes.includes(entityTypeFound)) {
        throw new EntityTypeNotFound(entity);
    }
    return entityTypeFound;
};

/**
 * validate request body according to request body object
 * @param {*} req client's request
 * @param {*} res server's response
 * @returns 
 */
function _validateRequestBody(req, res) {
    const reqBody = req.body;
    const reqObject = reqBody['object'];
    switch (reqObject) {        
        case 'entity':
            break;
        case 'relationship':
            break;
        case 'properties':
            const entityType = _getEntityType(reqBody['entityType']);
            if (entityType.toLowerCase() != req.params.entity) {
                throw new BadRequest('Request body entity mismatch!');  
            }
            const properties = reqBody['properties'];
            const entityScheme = getScheme(req, res, false);
            for (const [property, _value] of Object.entries(properties)) {
                if (property != entityScheme['name'] && 
                    !entityScheme['property'].includes(property)) {
                        console.log(property);
                    throw new BadRequest('Unknown request property in request body \'properties\''); 
                }
            }
            break;
        default:
            throw new BadRequest('Unknown request object: ' + reqObject);
    }

    return req.body;
}

/**
 * get all pre-defined entity types
 * @param {*} req client's request
 * @param {*} res server's response
 * @returns all pre-defined entity types
 */
function getAllEntityTypes(_req, res) {
    const respone = { 'entityType' : entityTypes };
    return writeResponse(res, respone);
}

/**
 * get entity scheme by entity type
 * @param {*} req client's request (containing entity's type)
 * @param {*} res server's response
 * @param {*} writeRes if true, write result back. else, return result object.
 * @returns requested entity's scheme
 */
function getScheme(req, res, writeRes = true) {
    const entityType = _getEntityType(req.params.entity);
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
            return getAllRecords(result.records[0], entity);
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
    const reqBody = _validateRequestBody(req, res);
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

    return executeCypherQuery(session, query, {}, 'WRITE')
    .then(result => validatePropertiesSet(result, Object.keys(properties).length))
    .then(response => writeResponse(res, response))
    .catch(error => {
        session.close();
        next(error);
    });
}


module.exports = {
    getAllEntityTypes: getAllEntityTypes,
    getScheme: getScheme,
    getEntityById: getEntityById,
    getAllEntitiesByType: getAllEntitiesByType,
    setEntityProperties: setEntityProperties
}