const neo4j = require('neo4j-driver');
const config = require('config');

const uri = config.get('dbHost');
const user = config.get('dbUser');
const password = config.get('dbPass');

const responseHandler = require('../helpers/response');
const { param } = require('../routes');
const response = require('../helpers/response');

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
    // const result = session.run(query, params);
  }
  catch (error) {
    session.close();
    throw error; // logging error at the time of calling this method
  }
};

// function validateCsvImport(resultObj) {
//     var result = [];
//     if (resultObj.records.length > 0) {
//         resultObj.records.forEach(function (record) {
//             var index = result.findIndex(l => l[0] == record._fields[0]);
//             if (index <= -1) {
//                 result.push(record._fields);
//             }
//         });
//     }
//     return result;
// }

/////////////////////////////
/// Load Entity Functions ///
/////////////////////////////

function loadEntityLabs(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/entity_tables//Lab.csv" as row ' +
    'CREATE (l: Lab { labId: row.labId, name: row.labName })');
}

function loadEntityResearchers(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/entity_tables//Researcher.csv" as row ' +
    'CREATE (r: Researcher { researcherId: row.researcherId, name: row.researcherName })');
}

function loadEntityResearchAreas(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/entity_tables//ResearchArea.csv" as row ' +
    'CREATE (ra: ResearchArea { researchAreaId: row.researchAreaId, name: row.researchAreaName })');
}

function loadEntityProducts(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/entity_tables//Product.csv" as row ' +
    'CREATE (p: Product { productId: row.productId, deviceId: row.deviceId, ' +
    'description: row.productDescription, manufacture: row.manufacture, ' +
    'dateCreated: row.dateCreated, endOfManufactureWarrenty: row.endofManufactureWarrenty })');
}

function loadEntityFaculties(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/entity_tables//Faculty.csv" as row ' +
    'CREATE(f: Faculty { facultyId: row.facultyId, facultyName: row.facultyName })');
}

function loadEntityArticles(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/entity_tables//Article.csv" as row ' +
    'CREATE(a: Article { articleId: row.articleId, URL: row.URL })');
}

function loadEntityResearchs(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/entity_tables//Research.csv" as row ' +
    'CREATE (r: Research { researchId: row.researchId, researchName: row.researchName })')
}

function loadEntityResearchSetups(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/entity_tables//ResearchSetup.csv" as row ' +
    'CREATE(rs: ResearchSetup { researchSetupId: row.researchSetupId, ' +
    'researchSetupName: row.researchSetupName })');
}

///////////////////////////////////
/// Load Relationship Functions ///
///////////////////////////////////

function loadRelationshipWasResearchedAt(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/WAS_RESEARCHED_AT.csv" as row ' +
    'MATCH(rsa: ResearchArea { researchAreaId: row.ResearchAreaId }), (l: Lab { labId: row.LabId }) ' +
    'CREATE(rsa) - [: WAS_RESEARCHED_AT] -> (l)');
}

function loadRelationshipUsedAt(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/USED_AT.csv" as row ' +
    'MATCH(p: Product { productId: row.ProductId }), (l: Lab { labId: row.LabId }) ' +
    'CREATE(p) - [: USED_AT] -> (l)');
}

function loadRelationshipResearches(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/RESEARCHES.csv" as row ' +
    'MATCH(r: Researcher { researcherId: row.ResearcherId }), (ra: ResearchArea { researchAreaId: row.ResearchAreaId }) ' +
    'CREATE (r) - [: RESEARCHES] -> (ra)');
}

function loadRelationshipUsing(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/USING.csv" as row ' +
    'MATCH(r: Researcher { researcherId: row.ResearcherId }), (p: Product { productId: row.ProductId }) ' +
    'CREATE (r) - [: USING { isOwner: row.isOwner }] -> (p)');
}

function loadRelationshipHasActiveProject(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/HAS_ACTIVE_PROJECT.csv" as row ' +
    'MATCH(r: Researcher { researcherId: row.ResearcherId }), (l: Lab { labId: row.LabId }) ' +
    'CREATE (r) - [: HAS_ACTIVE_PROJECT { onResearchAreas: [], isActive: row.isActive }] -> (l)');
}

function loadRelationshipConducts(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/CONDUCTS.csv" as row ' +
    'MATCH(r: Research { researchId: row.ResearchId }), (rr: Researcher { researcherId: row.ResearcherId }) ' +
    'CREATE (r) < -[: CONDUCTS] - (rr)');
}

function loadRelationshipPartOf(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/PART_OF.csv" as row ' +
    'MATCH(l: Lab { labId: row.LabId }), (f: Faculty { facultyId: row.FacultyId }) ' +
    'CREATE (l) - [: PART_OF] -> (f)');
}

function loadRelationshipRelevantTo(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/RELEVANT_TO.csv" as row ' +
    'MATCH(r: Research { researchId: row.ResearchId }), (ra: ResearchArea { researchAreaId: row.ResearchAreaId }) ' +
    'CREATE (r) - [: RELEVANT_TO] -> (ra)');
}

function loadRelationshipUsedIn(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/USED_IN.csv" as row ' +
    'MATCH(rs: ResearchSetup { researchSetupId: row.ResearchSetupId }), (r: Research { researchId: row.ResearchId }) ' +
    'CREATE (rs) - [: USED_IN] -> (r)');
}

function loadRelationshipWroteRegardTo(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/WROTE_REGARD_TO.csv" as row ' +
    'MATCH(a: Article { articleId: row.ArticleId }), (r: Research { researchId: row.ResearchId }) ' +
    'CREATE (p) - [: WROTE_REGARD_TO] -> (r)');
}

function loadRelationshipComposedOf(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/relationship_tables/COMPOSED_OF.csv" as row ' +
    'MATCH(rs: ResearchSetup { researchSetupId: row.ResearchSetupId }), (p: Product { productId: row.ProductId }) ' +
    'CREATE (rs) - [: COMPOSED_OF] -> (p)');
}

///////////////////////////////////////
/// Load Special Property Functions ///
///////////////////////////////////////

function loadSpecialPropertyHasActiveProject(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///import/special_property_tables/onResearchAreas.csv" as row ' +
    'MATCH(r: Researcher { researcherId: row.ResearcherId }) - [h: HAS_ACTIVE_PROJECT] -> (l: Lab { labId: row.LabId }) ' +
    'SET h.onResearchAreas = h.onResearchAreas + row.ResearchAreaId');
}

///////////////////////////////////
/// Create Constraint Functions ///
///////////////////////////////////

function createConstraintLabId(tx) {
  return tx.run('CREATE CONSTRAINT labIdUnique IF NOT EXISTS ON (l:Lab) ' +
    'ASSERT l.labId IS UNIQUE');
}

function createConstraintResearcherId(tx) {
  return tx.run('CREATE CONSTRAINT researcherIdUnique IF NOT EXISTS ON (r:Researcher) ' +
    'ASSERT r.researcherId IS UNIQUE');
}

function createConstraintResearchAreaId(tx) {
  return tx.run('CREATE CONSTRAINT researchAreaIdUnique IF NOT EXISTS ON (ra:ResearchArea) ' +
    'ASSERT ra.researchAreaId IS UNIQUE');
}

function createConstraintProductId(tx) {
  return tx.run('CREATE CONSTRAINT productIdUnique IF NOT EXISTS ON (p:Product) ' +
    'ASSERT p.productId IS UNIQUE');
}

function createConstraintFacultyId(tx) {
  return tx.run('CREATE CONSTRAINT facultyIdUnique IF NOT EXISTS ON (f:Faculty) ' +
    'ASSERT f.facultyId IS UNIQUE');
}

function createConstraintArticleId(tx) {
  return tx.run('CREATE CONSTRAINT articleIdUnique IF NOT EXISTS ON (p:Article) ' +
    'ASSERT p.articleId IS UNIQUE');
}

function createConstraintResearchId(tx) {
  return tx.run('CREATE CONSTRAINT researchIdUnique IF NOT EXISTS ON (r:Research) ' +
    'ASSERT r.researchId IS UNIQUE');
}

function createConstraintResearchSetupId(tx) {
  return tx.run('CREATE CONSTRAINT researchSetupIdUnique IF NOT EXISTS ON (rs:ResearchSetup) ' +
    'ASSERT rs.researchSetupId IS UNIQUE');
}



function loadDataFromCsv(req, res) {  
  const savedBookmarks = [];
  const session = getSession(req);
  const txRes = session.writeTransaction(tx => loadEntityLabs(tx))
    .then(() => session.writeTransaction(tx => loadEntityResearchers(tx)))
    .then(() => session.writeTransaction(tx => loadEntityResearchAreas(tx)))
    .then(() => session.writeTransaction(tx => loadEntityProducts(tx)))
    .then(() => session.writeTransaction(tx => loadEntityFaculties(tx)))
    .then(() => session.writeTransaction(tx => loadEntityResearchSetups(tx)))
    .then(() => session.writeTransaction(tx => loadEntityResearchs(tx)))
    .then(() => session.writeTransaction(tx => loadEntityArticles(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipWasResearchedAt(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipUsedAt(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipResearches(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipUsing(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipHasActiveProject(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipConducts(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipPartOf(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipRelevantTo(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipUsedIn(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipWroteRegardTo(tx)))
    .then(() => session.writeTransaction(tx => loadRelationshipComposedOf(tx)))
    .then(() => session.writeTransaction(tx => loadSpecialPropertyHasActiveProject(tx)))
    .then(() => session.writeTransaction(tx => createConstraintLabId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintResearcherId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintProductId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintResearchAreaId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintFacultyId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintArticleId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintResearchId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintResearchSetupId(tx)))
    .then(() => {
      savedBookmarks.push(session.lastBookmark())
    })
    .then(() => session.close())
    // .then(result => responseHandler.formatResponse(result))
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
  .then(() => {
    savedBookmarks.push(session.lastBookmark())
  })
    .then(() => session.close())
    // .then(result => responseHandler.formatResponse(result))
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
  loadDataFromCsv: loadDataFromCsv,
  deleteDatabase: deleteDatabase
}