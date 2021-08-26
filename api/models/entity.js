const _ = require('lodash');

const Article = require('../models/article');
const Lab = require('../models/lab');
const Faculty = require('../models/faculty');
const Research = require('../models/research');
const ResearchArea = require('../models/researchArea');
const Researcher = require('../models/researcher');
const ResearchSetup = require('../models/researchSetup');
const Product = require('../models/product');

const responseHandler = require('../helpers/response');
const writeResponse = responseHandler.writeResponse;
const { GeneralError, BadRequest, NotFound } = require('../utils/errors');


function getScheme(req, res, next) {
    const entityType = _.toLower(req.params.entity);
    switch(entityType) {
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
            next(new GeneralError('Could not get scheme for entity: ' + entityType));
    }
}

module.exports = {
    getScheme: getScheme
}