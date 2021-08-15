const neo4j = require('neo4j-driver');
const config = require('config');

const uri = config.get('dbHost');
const user = config.get('dbUser');
const password = config.get('dbPass');

const responseHandler = require('../helpers/response');
const importer = require('../helpers/graphDBImporter');
const exporter = require('../helpers/graphDBExporter');
const enforcer = require('../helpers/graphDBEnforcer');

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
  maxConnectionPoolSize: 50,
  connectionAcquisitionTimeout: 2 * 60 * 1000, // 120 seconds
  disableLosslessIntegers: true
});

function getSession(context) {
  if (context.neo4jSession) {
    return context.neo4jSession;
  }
  else {
    context.neo4jSession = driver.session();
    return context.neo4jSession;
  }
};

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
    throw error; // logging error at the time of calling this method
  }
};

function importDataFromCsv(req, res) {  
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
      console.log(error);
      session.close();
      return;
    });

  Promise.all([txRes]);
}

function exportDataToCsv(req, res) {  
  const savedBookmarks = [];
  const session = getSession(req);
  const txRes = exporter.exportEntitiesData(session)
    // .then(() => exporter.exportRelationshipData(session))
    // .then(() => exporter.exportSpecialPropertyData(session))
    .then(() => {
      savedBookmarks.push(session.lastBookmark())
    })
    .then(() => session.close())
    .then(response => responseHandler.writeResponse(res, response))
    .catch(error => {
      console.log(error);
      session.close();
      return;
    });

  Promise.all([txRes]);
}

async function deleteDatabase(req, res) {
  const savedBookmarks = [];
  const session = getSession(req);
  const txRes = session.writeTransaction(tx => tx.run('MATCH (n) DETACH DELETE n'))
  .then(() => session.writeTransaction(tx => tx.run('CALL apoc.schema.assert({}, {})')))
  .then(() => {
    savedBookmarks.push(session.lastBookmark())
  })
    .then(() => session.close())
    .then(response => responseHandler.writeResponse(res, response))
    .catch(error => {
      console.log(error);
      session.close();
      return;
    });

  Promise.all([txRes]);
};

module.exports = {
    getSession: getSession,
    executeCypherQuery: executeCypherQuery,
    importDataFromCsv: importDataFromCsv,
    exportDataToCsv: exportDataToCsv, 
    deleteDatabase: deleteDatabase
}