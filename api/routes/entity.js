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
const responseHandler = require('../helpers/response');
const writeResponse = responseHandler.writeResponse;
const { EntityTypeNotFound, EntityIdNotFound } = require('../utils/errors');

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
 * get all pre-defined entity types
 * @param {*} req client request
 * @param {*} res server result
 * @returns all pre-defined entity types
 */
function getAllEntityTypes(_req, res) {
    const respone = { 'entityType' : entityTypes };
    return writeResponse(res, respone);
};

/**
 * get entity scheme by entity type
 * @param {*} req client request containing entity type
 * @param {*} res server result
 * @returns requested entity's scheme
 */
function getScheme(req, res) {
    var entityType;
    try {
        entityType = _getEntityType(req.params.entity);
    } catch (err) {
        throw err;
    }

    switch(entityType) {
        case 'Article':
            return writeResponse(res, Article.getScheme());
        case 'Faculty':
            return writeResponse(res, Faculty.getScheme());
        case 'Lab':
            return writeResponse(res, Lab.getScheme());
        case 'Research':
            return writeResponse(res, Research.getScheme());
        case 'ResearchArea':
            return writeResponse(res, ResearchArea.getScheme());
        case 'Researcher':
            return writeResponse(res, Researcher.getScheme());
        case 'ResearchSetup':
            return writeResponse(res, ResearchSetup.getScheme());    
        case 'Product':
            return writeResponse(res, Product.getScheme());
        default:
    }
};

/**
 * get entity by entity id
 * @param {*} req client request containing entity type, id
 * @param {*} res server result
 * @returns requested entity 
 */
function getEntityById(req, res, next) {
    const entityId = req.params.id;
    var entityType;
    try {
        entityType = _getEntityType(req.params.entity);
    } catch (err) {
        throw err;
    }    
    
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
};

/**
 * get all entities matching passed 'entity'
 * @param {*} req client request containing entity
 * @param {*} res server result
 * @param {*} next 
 * @returns 
 */
function getAllEntitiesByType(req, res, next) {
    const entity = _.toLower(req.params.entity);
    var entityType;
    try {
        entityType = _getEntityType(entity);
    } catch (err) {
        throw err;
    }
                                
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
};

module.exports = {
    getAllEntityTypes: getAllEntityTypes,
    getScheme: getScheme,
    getEntityById: getEntityById,
    getAllEntitiesByType: getAllEntitiesByType
}