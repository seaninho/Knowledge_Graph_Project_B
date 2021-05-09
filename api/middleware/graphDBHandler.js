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
    // const result = session.readTransaction(txc => txc.run(query, params));
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
    WITH row, split(row.ResearchAreas, ",") as researchAreas \
    UNWIND researchAreas as ra \
    MERGE(l: Lab { id: row.LabId, name: row.Lab }) \
    MERGE(r: ResearchArea { name: ra }) \
    MERGE(l) < -[: WAS_RESEARCHED_AT] - (r) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///Researchers.csv" as row \
    WITH row, split(row.Labs, ",") as labs, split(row.ResearchAreas, ",") as researchAreas \
    UNWIND labs as lab \
    UNWIND researchAreas as ra \
    MERGE(r: Researcher { name: row.Researcher }) \
    MERGE(l: Lab { name: lab }) \
    MERGE(rsa: ResearchArea { name: ra }) \
    MERGE(r) - [: HAS_ACTIVE_PROJECT] -> (l) \
    MERGE(r) - [: RESEARCH] -> (rsa) \
    WITH count(*) as dummy \
    LOAD CSV WITH HEADERS FROM "file:///Products.csv" as row \
    WITH row, split(row.ResearchAreas, ",") as researchAreas \
    UNWIND researchAreas as ra \
    MERGE(p: Product { \
      productID: row.ProductID, deviceID: row.DeviceID, \
      description: row.Description, manufacture: row.Manufacture, \
      dateCreated: row.DateCreated, endOfManufactureWarrenty: row.EndofManufactureWarrenty \
    }) \
    MERGE(r: Researcher { name: row.Researcher }) \
    MERGE(l: Lab { name: row.Lab }) \
    MERGE(rsa: ResearchArea { name: ra }) \
    MERGE(r) - [: PURCHASED] -> (p) \
    MERGE(p) - [: USED_IN] -> (rsa) \
    MERGE(p) - [: USED_AT] -> (l)';
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