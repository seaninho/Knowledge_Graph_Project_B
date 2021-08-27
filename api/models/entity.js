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
const { GeneralError, BadRequest, NotFound } = require('../utils/errors');

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
 * get all pre-defined entity types
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns
 */
function getAllEntityTypes(_req, res, next) {
    const respone = { 'entityType' : entityTypes };
    writeResponse(res, respone)
    .catch(error => {      
      next(error);
    });
};

/**
 * get entity scheme by entity type
 * @param {*} req request containing entity type
 * @param {*} res 
 * @param {*} next 
 */
function getScheme(req, res) {
    const lowerCaseEntityType = _.toLower(req.params.entity);
    switch(lowerCaseEntityType) {
        case 'article':
            return writeResponse(res, Article.getScheme());
        case 'faculty':
            return writeResponse(res, Faculty.getScheme());
        case 'lab':
            return writeResponse(res, Lab.getScheme());
        case 'research':
            return writeResponse(res, Research.getScheme());
        case 'researchArea':
            return writeResponse(res, ResearchArea.getScheme());
        case 'researcher':
            return writeResponse(res, Researcher.getScheme());
        case 'researchSetup':
            return writeResponse(res, ResearchSetup.getScheme());    
        case 'product':
            return writeResponse(res, Product.getScheme());
        default:
            throw new GeneralError('Could not get scheme for entity: ' 
                + lowerCaseEntityType);
    }
};

/**
 * get entity by entity id
 * @param {*} req request containing entity id
 * @param {*} res 
 * @param {*} next 
 */
function getEntityById(req, res) {
    const lowerCaseEntityType = _.toLower(req.params.entity);
    const entityId = req.params.id;
    switch(lowerCaseEntityType) {
        case 'article':
            return Article.getArticleById(getSession(req), entityId)
            .then(response => writeResponse(res, response));
        case 'faculty':
            return Faculty.getFacultyById(getSession(req), entityId)
            .then(response => writeResponse(res, response));
        case 'lab':
            return Lab.getLabById(getSession(req), entityId)
            .then(response => writeResponse(res, response));
        case 'research':
            return Research.getResearchById(getSession(req), entityId)
            .then(response => writeResponse(res, response));
        case 'researchArea':
            return ResearchArea.getResearchAreaById(getSession(req), entityId)
            .then(response => writeResponse(res, response));
        case 'researcher':
            return Researcher.getResearcherById(getSession(req), entityId)
            .then(response => writeResponse(res, response));
        case 'researchSetup':
            return ResearchSetup.getResearchSetupById(getSession(req), entityId)
            .then(response => writeResponse(res, response)); 
        case 'product':
            return Product.getProductById(getSession(req), entityId)
            .then(response => writeResponse(res, response));
        default:            
            throw new GeneralError('Could not get instance for entity: ' 
                + lowerCaseEntityType + ' with id: ' + entityId);
    }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function getAllInstances(req, res, next) {
  const entity = _.toLower(req.params.entity)
  const entityType = entity.charAt(0).toUpperCase() + entity.slice(1);
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
        else {
            throw new GeneralError('No ' + entityType + ' Was Found!');
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
    getAllInstances: getAllInstances
}