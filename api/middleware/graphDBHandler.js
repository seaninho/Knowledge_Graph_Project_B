const _ = require('lodash');
const neo4j = require('neo4j-driver');
const config = require('config');
const { PythonShell } = require('python-shell');

const uri = config.get('dbHost');
const user = config.get('dbUser');
const password = config.get('dbPass');

const importer = require('../helpers/graphDBImporter');
const exporter = require('../helpers/graphDBExporter');
const enforcer = require('../helpers/graphDBEnforcer');
const responseHandler = require('../helpers/response');
const writeResponse = responseHandler.writeResponse;
const { GeneralError, BadRequest, NotFound, DatabaseActionError } = require('../utils/errors');
const response = require('../helpers/response');

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
function getSession(context, getNewSession = false) {
    if (context.neo4jSession && getNewSession === false) {
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
 * validate database response for a 'getById' request
 * @param {*} response neo4j response
 * @returns true if response is valid, false otherwise
 */
function validateDatabaseGetByIdResponse(response) {
    return !_.isEmpty(response.records) && 
        !response.records[0]._fields.every(field => _.isEmpty(field));
}

/**
 * validate all provided properties were successfully set
 * @param {*} result neo4j result object
 * @param {*} possiblePropertiesSet number of properties to be set
 * @returns Notifing the client of success in setting the desired properties. 
 * Otherwise, throws an exception notifing of failure.
 */
function validatePropertiesSet(result, possiblePropertiesSet) {
    const actualPropertiesSet = result.summary['counters']['_stats']['propertiesSet'];
    if (actualPropertiesSet == possiblePropertiesSet) {
        return { 
            status: 'ok', 
            message: 'Properties were successfully set!' 
        };
    } 
    else {
        throw new GeneralError('Failed to set properties!');
    }
}

/**
 * validate all provided relationships were successfully created
 * @param {*} result neo4j result object
 * @param {*} possibleRelationshipsCreated number of relationships to be created
 * @returns Notifing the client of success in creating the desired relationships. 
 * Otherwise, throws an exception notifing of failure.
 */
function validateRelationShipsCreated(result, possibleRelationshipsCreated) {
    const actualRelationshipsCreated = result.summary['counters']['_stats']['relationshipsCreated'];
    if (actualRelationshipsCreated == possibleRelationshipsCreated) {
        return { 
            status: 'ok', 
            message: 'Relationships were successfully created!' 
        };
    } 
    else {
        throw new GeneralError('Failed to create relationships!');
    }
}

/**
 * validate entity was successfully created
 * @param {*} result neo4j result object
 * @param {*} possiblePropertiesSet number of properties to be set
 * @returns Notifing the client of success in creating the desired entity. 
 * Otherwise, throws an exception notifing of failure.
 */
function validateEntityCreated(result, possiblePropertiesSet) {
    const actualEntitiesCreated = result.summary['counters']['_stats']['nodesCreated'];    
    if (actualEntitiesCreated == 1) {  // creating one entity at a time
        validatePropertiesSet(result, possiblePropertiesSet);
        return { 
            status: 'ok', 
            message: 'Entity was successfully created!' 
        };
    } 
    else {
        throw new GeneralError('Failed to create entity!');
    }
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
        const response = { 'entityType': entityTypesFound };
        writeResponse(res, response);
    })
    .catch(error => {
        session.close();
        next(error);
    });
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
        const response = { 'relationshipType': relationshipTypesFound };
        writeResponse(res, response);
    })
    .catch(error => {
        session.close();
        next(error);
    });
}

/**
 * get all nodes stored in records by field key
 * @param {*} records neo4j result records
 * @param {*} fieldKey lookup key
 * @param {*} resultIsSingleNode boolean value indicating whether or not the result object is of a single node
 * @returns an object containing all nodes found matching the label key provided.
 * If no nodes were found, returns an empty object.
 */
function getAllNodesByFieldKey(records, fieldKey, resultIsSingleNode = false) {
    var nodes, nodeLabel;
    var nodesProperties = [];
    for (let record of records) {
        nodes = record.get(fieldKey);
        if (!_.isEmpty(nodes)) {
            if (Array.isArray(nodes)) {
                nodeLabel = nodes[0].labels[0];
                nodesProperties = nodesProperties.concat(_.map(nodes, node => node.properties));
            }
            else {
                nodeLabel = nodes.labels[0];
                nodesProperties = nodesProperties.concat(nodes.properties);
            } 
        }
    }
    
    var result;
    if (typeof nodeLabel !== 'undefined' && !_.isEmpty(nodesProperties)) {
        result = {
            'entityType': nodeLabel,
            'entityList': nodesProperties
        }; 
    }        
    return resultIsSingleNode ? nodesProperties[0] : result;
};

/**
 * get full path for the neo4j dbmss directory
 * @param {*} session neo4j session
 * @returns neo4j dbmss directory full path
 */
function _getNeo4jDbmssDirectory(session) {
    const query = [
        'Call dbms.listConfig() YIELD name, value',
        'WHERE name=\'dbms.directories.neo4j_home\'',
        'RETURN value'
    ].join('\n');
    const params = {};

    return executeCypherQuery(session, query, params)
    .then(result => {  
        if (!_.isEmpty(result.records) ) {
            var folderPath = result.records[0].get('value');
            // dbms.directories.neo4j_home returns active dbms directory
            return folderPath.split('\\dbms-')[0];
        }
    })
    .catch(error => {
        session.close();
        next(error);
    });
}

/**
 * verify database is empty (clear)
 * @param {*} session neo4j session
 * @param {*} errorMessage error message to display in case database isn't clear
 */
async function _verifyDatabaseIsClear(session, errorMessage) {
    const query = 'MATCH (n) RETURN n';
    const params = {};

    const result = await executeCypherQuery(session, query, params)
    if (!_.isEmpty(result.records)) {
        throw new GeneralError(errorMessage);
    }
}


/**
 * restore graph database from csv files (import)
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} next next function to execute
 * @param {*} respond write result iff true
 * @param {*} path restore database from this directory
 * @returns Notifying the client of success in restoring the database.
 * Otherwise, throws an exception notifing of failure.
 */
async function restoreDatabase(req, res, next, respond = true, path = '') {  
    const session = getSession(req);
    try {
        await _verifyDatabaseIsClear(
            session,
            'Please delete database prior to restore!'
        );
        const neo4jDbmssDirectory = await _getNeo4jDbmssDirectory(session);
        const defaultRestorePath =
            neo4jDbmssDirectory + '\\researshare\\import\\';
        await importer.importGraphDatabase(
            session,
            path == '' ? defaultRestorePath : path
        );
        await enforcer.createGraphConstraints(session);
        
        if (respond == true) {
            const response = {
                status: 'ok',
                message: 'Database Restored Successfully!',
            };
            writeResponse(res, response);
        }        
    }
    catch (error) {
        if (!(error instanceof GeneralError)) {
            deleteDatabase(req, res, next, false);
        }

        if (respond == true) {
            return next(new DatabaseActionError('Restore', error));
        }
        throw error;
    }
}

/**
 * backup graph database to csv files (export)
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} next next function to execute
 */
async function backupDatabase(req, res, next) {  
    const session = getSession(req);
    try {
        const neo4jDbmssDirectory = await _getNeo4jDbmssDirectory(session);
        const backupDirectoryBase = neo4jDbmssDirectory + '\\researshare\\backup';
        const backupDirectory = await exporter.exportGraphDatabase(session, backupDirectoryBase);
        const response = {
            status: 'ok',
            message:
                'Database has been successfully backed up to ' +
                backupDirectory,
        };
        return writeResponse(res, response);
    } catch (error) {
        session.close();
        next(new DatabaseActionError('Backup', error));
    }
}

/**
 * delete graph database
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} next next function to execute
 * @param {*} respond write result iff true
 * @returns Notifing the client of success in deleting the database. 
 * Otherwise, throws an exception notifing of failure.
 */
async function deleteDatabase(req, res, next, respond = true) {
    const session = getSession(req);
    try {
        await session.writeTransaction(tx => tx.run('MATCH (n) DETACH DELETE n'))       // Clear Database
        await session.writeTransaction(tx => tx.run('CALL apoc.schema.assert({}, {})'))  // Clear Constraints
        await _verifyDatabaseIsClear(session, 'Database Was Not Deleted Properly!')
        if (respond == true) {
            const response = {
                status: 'ok',
                message: 'Database Deleted Successfully!'
            };
            writeResponse(res, response);
        }
    }
    catch (error) {
        session.close();
        next(new DatabaseActionError('Delete', error));
    }
};

/**
 * initialize graph database
 * @param {*} req client's request
 * @param {*} res server's response
 * @param {*} next next function to execute
 */
async function initializeDatabase(req, res, next) {
    const session = getSession(req);
    const neo4jDbmssDirectory = await _getNeo4jDbmssDirectory(session);  
    const directoryBasePath = neo4jDbmssDirectory + '\\researshare';
    const pythonScriptsPath = directoryBasePath + '\\scripts';
    const schemeTablePath = directoryBasePath + '\\model\\graphScheme.csv';
    const lookupTablePath = directoryBasePath + '\\model\\lookupTable.csv';
    const facultyTablesPath = directoryBasePath + '\\faculty_tables_base';
    const destinationDirectoryName = 'import';

    var options = {
        mode: 'text',        
        scriptPath: pythonScriptsPath,
        args: [
            schemeTablePath,
            lookupTablePath,
            facultyTablesPath,
            directoryBasePath,
            destinationDirectoryName,
        ],
    };
    
    PythonShell.run('raw_to_graph_tables_converter.py', options, async function (error) {
        if (error) {            
            next(new DatabaseActionError('Initialize', error));
        }

        try {
            await restoreDatabase(req, res, next, false);

            const response = {
                status: 'ok',
                message: 'Database Initialized Successfully!',
            };
            writeResponse(res, response);
        }
        catch (error) {
            next(new DatabaseActionError('Initialize', error.getMessage()));
        }        
    });
}


module.exports = {
    getSession: getSession,
    executeCypherQuery: executeCypherQuery,
    validatePropertiesSet: validatePropertiesSet,
    validateRelationShipsCreated: validateRelationShipsCreated,
    validateEntityCreated: validateEntityCreated,
    validateDatabaseGetByIdResponse: validateDatabaseGetByIdResponse,
    getAllEntityTypes: getAllEntityTypes,
    getAllRelationshipTypes: getAllRelationshipTypes,
    getAllNodesByFieldKey: getAllNodesByFieldKey,
    restoreDatabase: restoreDatabase,
    backupDatabase: backupDatabase, 
    deleteDatabase: deleteDatabase,
    initializeDatabase: initializeDatabase
}