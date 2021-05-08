const neo4j = require('neo4j-driver');
const config = require('config');

const uri = config.get('dbHost');
const user = config.get('dbUser');
const password = config.get('dbPass');

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
  maxConnectionPoolSize: 50,
  connectionAcquisitionTimeout: 2 * 60 * 1000, // 120 seconds
  disableLosslessIntegers: true
});

exports.getSession = function (context) {
  if (context.neo4jSession) {
    return context.neo4jSession;
  }
  else {
    context.neo4jSession = driver.session();
    return context.neo4jSession;
  }
};

exports.executeCypherQuery = function (session, query, params = {}) {
  try {
    const result = session.run(query, params);
    // session.close();
    return result;
  } catch (error) {
    throw error; // logging error at the time of calling this method
  }
};
