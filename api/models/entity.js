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

/**
 * get all pre-defined entity types
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns
 */
function getAllEntityTypes(_req, res, next) {
    const entityTypes = { 
        'entityType' : 
        [
            'Article', 
            'Faculty', 
            'Lab', 
            'Product', 
            'Research', 
            'ResearchArea', 
            'Researcher', 
            'ResearchSetup'
        ] 
    }
    writeResponse(res, entityTypes)
    .catch(error => {      
      next(error);
    });
}

/**
 * get entity scheme by entity type
 * @param {*} req request containing entity type
 * @param {*} res 
 * @param {*} next 
 */
function getScheme(req, res, next) {
    const lowerCaseEntityType = _.toLower(req.params.entity);
    switch(lowerCaseEntityType) {
        case 'article':
            writeResponse(res, Article.getScheme());
        case 'faculty':
            writeResponse(res, Faculty.getScheme());
        case 'lab':
            writeResponse(res, Lab.getScheme());
        case 'research':
            writeResponse(res, Research.getScheme());
        case 'researchArea':
            writeResponse(res, ResearchArea.getScheme());
        case 'researcher':
            writeResponse(res, Researcher.getScheme());
        case 'researchSetup':
            writeResponse(res, ResearchSetup.getScheme());    
        case 'product':
            writeResponse(res, Product.getScheme());
        default:
            next(new GeneralError('Could not get scheme for entity: ' 
                + lowerCaseEntityType));
    }
}

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
    getAllInstances: getAllInstances
}