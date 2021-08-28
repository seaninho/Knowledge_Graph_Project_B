const _ = require('lodash');
const neo4j = require('neo4j-driver');
const config = require('config');

const uri = config.get('dbHost');
const user = config.get('dbUser');
const password = config.get('dbPass');

const importer = require('../helpers/graphDBImporter');
const exporter = require('../helpers/graphDBExporter');
const enforcer = require('../helpers/graphDBEnforcer');
const responseHandler = require('../helpers/response');
const { GeneralError, BadRequest, NotFound } = require('../utils/errors');

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000, // 120 seconds
    disableLosslessIntegers: true
});

/**
 * get neo4j session
 * @param {*} context 
 * @returns neo4j session
 */
function getSession(context) {
    if (context.neo4jSession) {
        return context.neo4jSession;
    }
    else {
        context.neo4jSession = driver.session();
        return context.neo4jSession;
    }
};

/**
 * execute a Cypher query on graph database
 * @param {*} session neo4j session
 * @param {*} query Cypher query to be executed
 * @param {*} params query parameters
 * @param {*} op operation (read/write)
 * @returns 
 */
async function executeCypherQuery(session, query, params = {}, op = 'READ') {
    try {
        if (op == 'READ') {
            return await session.readTransaction(tx => tx.run(query, params));
        }
        else {
            return await session.writeTransaction(tx => tx.run(query, params));
        }    
    }
    catch (error) {
        session.close();
        throw error; 
    }
};

/**
 * validate database response
 * @param {*} result 
 * @returns true if response is valid, false otherwise
 */
function validateResult(result) {
    return !_.isEmpty(result.records) && 
            !result.records[0]._fields.every(e => _.isEmpty(e));
}

/**
 * validate entity's properties were successfully set
 * @param {*} result neo4j result object
 * @param {*} possibleProprtiesSet number of properties to be set
 * @returns Notifing the client of success in setting the desired properties. 
 * Otherwise, throws an exception notifing of failure.
 */
function validatePropertiesSet(result, possibleProprtiesSet) {
    const actualPropertiesSet = result.summary['counters']['_stats']['propertiesSet'];
    if (actualPropertiesSet == possibleProprtiesSet) {
        return { 
            status: 'ok', 
            message: 'Properties were successfully set!' 
        };
    } 
    else {
        throw new GeneralError('Properties failed to be set!');
    }
}

/**
 * 
 * @param {*} record 
 * @param {*} label 
 * @returns 
 */
function getRecordPropertiesByLabel(record, label) {
    return _.map(record.get(label), record => record.properties);
};

/**
 * 
 * @param {*} record 
 * @param {*} recordKey 
 * @returns 
 */
function getAllRecordsByKey(record, recordKey) {
    if (!_.find(record.keys, recordKey) &&
        !_.isEmpty(record.get(recordKey))) {
        return {
            'entityType': record.get(recordKey)[0].labels[0],
            'entityList': getRecordPropertiesByLabel(record, recordKey) 
        };   
    }
};


/**
 * import data from csv files
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} next next function to execute
 */
function importDataFromCsv(req, res, next) {  
    const savedBookmarks = [];
    const session = getSession(req);
    const txRes = importer.importEntitiesData(session)
    .then(() => importer.importRelationshipData(session))
    .then(() => importer.importSpecialPropertyData(session))
    .then(() => enforcer.createGraphConstraints(session))
    .then(() => {
        savedBookmarks.push(session.lastBookmark())
    })
    .then(() => session.close())
    .then(response => responseHandler.writeResponse(res, response))
    .catch(error => {
        session.close();
        next(error);
    });

  Promise.all([txRes]);
}

/**
 * export data to csv files
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} next next function to execute
 */
function exportDataToCsv(req, res, next) {  
    const savedBookmarks = [];
    const session = getSession(req);
    const txRes = exporter.exportEntitiesData(session)
    .then(() => exporter.exportRelationshipData(session))
    .then(() => exporter.exportSpecialPropertyData(session))
    .then(() => {
        savedBookmarks.push(session.lastBookmark())
    })
    .then(() => session.close())
    .then(response => responseHandler.writeResponse(res, response))
    .catch(error => {
        session.close();
        next(error);
    });

    Promise.all([txRes]);
}

/**
 * delete graph database
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} next next function to execute
 * @returns Notifing the client of success in deleting the database. 
 * Otherwise, throws an exception notifing of failure.
 */
async function deleteDatabase(req, res, next) {
    const savedBookmarks = [];
    const session = getSession(req);
    const txRes = session.writeTransaction(tx => tx.run('MATCH (n) DETACH DELETE n'))       // Clear Database
    .then(() => session.writeTransaction(tx => tx.run('CALL apoc.schema.assert({}, {})')))  // Clear Constraints
    .then(() => session.readTransaction(tx => tx.run('MATCH (n) RETURN n')))
    .then(result => {
    if (!_.isEmpty(result.records)) {
        throw new GeneralError('Database Was Not Deleted Properly!');
    }
    })
    .then(() => { savedBookmarks.push(session.lastBookmark()) })
    .then(() => session.close())
    .then(() => {
        const response = {
            status: 'ok',
            message: 'Database Deleted Successfully!'
        };
        responseHandler.writeResponse(res, response);
    })       
    .catch(error => {
        session.close();
        next(error);
    });

    Promise.all([txRes]);
};

module.exports = {
    getSession: getSession,
    executeCypherQuery: executeCypherQuery,
    validatePropertiesSet: validatePropertiesSet,
    validateResult: validateResult,
    getRecordPropertiesByLabel: getRecordPropertiesByLabel,
    getAllRecordsByKey: getAllRecordsByKey,
    importDataFromCsv: importDataFromCsv,
    exportDataToCsv: exportDataToCsv, 
    deleteDatabase: deleteDatabase
}