const neo4j = require('neo4j-driver');
const config = require('config');

const uri = config.get('dbHost');
const user = config.get('dbUser');
const password = config.get('dbPass');

const responseHandler = require('../helpers/response');

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

function executeCypherQuery(session, query, params = {}) {
  try {
    const result = session.run(query, params);
    // session.close();
    return result;
  } catch (error) {
    throw error; // logging error at the time of calling this method
  }
};

function validateCsvImport(resultObj) {
    var result = [];
    if (resultObj.records.length > 0) {
        resultObj.records.forEach(function (record) {
            var index = result.findIndex(l => l[0] == record._fields[0]);
            if (index <= -1) {
                result.push(record._fields);
            }
        });
    }
    return result;
}

async function loadDataFromCsv(req, res) {
  var session = getSession(req);
  // "WITH count(*) as dummy" used to run multiple queries in a serial manner
  var query = 
    'LOAD CSV WITH HEADERS FROM "file:///Labs.csv" as row \
    CREATE(l: Lab { labId: row.LabId, name: row.LabName }) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///Researchers.csv" as row \
    CREATE(r: Researcher { researcherId: row.ResearcherId, name: row.ResearcherName }) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///ResearchAreas.csv" as row \
    CREATE(ra: ResearchArea { researchAreaId: row.ResearchAreaId, name: row.ResearchAreaName }) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///Products.csv" as row \
    CREATE(p: Product { productId: row.ProductId, deviceId: row.DeviceId, description: row.Description, \
      manufacture: row.Manufacture, dateCreated: row.DateCreated, endOfManufactureWarrenty: \
      row.EndofManufactureWarrenty }) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///ResearchAreas.csv" as row \
    MATCH(rsa: ResearchArea { researchAreaId: row.ResearchAreaId }), (l: Lab { labId: row.LabId }) \
    CREATE(rsa) - [: WAS_RESEARCHED_AT] -> (l) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///Products.csv" as row \
    MATCH(p: Product { productId: row.ProductId }), (r: Researcher { researcherId: row.ResearcherId }), \
      (l: Lab { labId: row.LabId }) \
    CREATE (r) - [: PURCHASED] -> (p) \
    CREATE(p) - [: USED_AT] -> (l) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///Researches.csv" as row \
    MATCH(r: Researcher { researcherId: row.ResearcherId }), (ra: ResearchArea { researchAreaId: row.ResearchAreaId }) \
    CREATE(r) - [: RESEARCHES] -> (ra) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///UsedInResearchArea.csv" as row \
    MATCH(p: Product { productId: row.ProductId }), (ra: ResearchArea { researchAreaId: row.ResearchAreaId }) \
    CREATE(p) - [: USED_IN] -> (ra) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///HasActiveProject.csv" as row \
    MATCH(r: Researcher { researcherId: row.ResearcherId }), (l: Lab { labId: row.LabId }) \
    MERGE(r) - [: HAS_ACTIVE_PROJECT { onResearchAreas: [] }] -> (l) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///HasActiveProject.csv" as row \
    MATCH(r: Researcher { researcherId: row.ResearcherId }) - [h: HAS_ACTIVE_PROJECT] -> (l: Lab { labId: row.LabId }) \
    SET h.onResearchAreas = h.onResearchAreas + row.UnderResearchAreaId'
  var resultObj = await executeCypherQuery(session, query);
  const result = validateCsvImport(resultObj);
  responseHandler.writeResponse(res, result);
}

async function deleteDatabase(req, res) {
  const query = 'MATCH (n) DETACH DELETE n';
  const session = getSession(req);
  var resultObj = await executeCypherQuery(session, query);
  var response = responseHandler.formatResponse(resultObj);
  responseHandler.writeResponse(res, response);
};

module.exports = {
  getSession: getSession,
  executeCypherQuery: executeCypherQuery,
  loadDataFromCsv: loadDataFromCsv,
  deleteDatabase: deleteDatabase
}