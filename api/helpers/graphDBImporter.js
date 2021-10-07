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

////////////////////////
/// Entity Functions ///
////////////////////////

function _importEntityLabs(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///entity_tables//Lab.csv" as row ' +
    'CREATE (l: Lab { labId: row.labId, labName: row.labName })');
}

function _importEntityResearchers(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///entity_tables//Researcher.csv" as row ' +
    'CREATE (r: Researcher { researcherId: row.researcherId, researcherName: row.researcherName })');
}

function _importEntityResearchAreas(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///entity_tables//ResearchArea.csv" as row ' +
    'CREATE (ra: ResearchArea { researchAreaId: row.researchAreaId, researchAreaName: row.researchAreaName })');
}

function _importEntityProducts(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///entity_tables//Product.csv" as row ' +
    'CREATE (p: Product { productId: row.productId, deviceId: row.deviceId, ' +
    'productDescription: row.productDescription, productManufacture: row.productManufacture, ' +
    'productDateCreated: row.productDateCreated, endOfManufactureWarrenty: row.endOfManufactureWarrenty, ' +
    'isActiveProduct: row.isActiveProduct})');
}

function _importEntityFaculties(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///entity_tables//Faculty.csv" as row ' +
    'CREATE(f: Faculty { facultyId: row.facultyId, facultyName: row.facultyName })');
}

function _importEntityArticles(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///entity_tables//Article.csv" as row ' +
    'CREATE(a: Article { articleId: row.articleId, URL: row.URL })');
}

function _importEntityResearches(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///entity_tables//Research.csv" as row ' +
    'CREATE (r: Research { researchId: row.researchId, researchName: row.researchName })')
}

function _importEntityResearchSetups(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///entity_tables//ResearchSetup.csv" as row ' +
    'CREATE(rs: ResearchSetup { researchSetupId: row.researchSetupId, ' +
    'researchSetupName: row.researchSetupName })');
}

//////////////////////////////
/// Relationship Functions ///
//////////////////////////////

function _importRelationshipWasResearchedAt(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/WAS_RESEARCHED_AT.csv" as row ' +
    'MATCH(rsa: ResearchArea { researchAreaId: row.ResearchAreaId }), (l: Lab { labId: row.LabId }) ' +
    'CREATE(rsa) - [: WAS_RESEARCHED_AT] -> (l)');
}

function _importRelationshipUsedAt(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/USED_AT.csv" as row ' +
    'MATCH(p: Product { productId: row.ProductId }), (l: Lab { labId: row.LabId }) ' +
    'CREATE(p) - [: USED_AT] -> (l)');
}

function _importRelationshipResearches(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/RESEARCHES.csv" as row ' +
    'MATCH(r: Researcher { researcherId: row.ResearcherId }), (ra: ResearchArea { researchAreaId: row.ResearchAreaId }) ' +
    'CREATE (r) - [: RESEARCHES] -> (ra)');
}

function _importRelationshipUsing(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/USING.csv" as row ' +
    'MATCH(r: Researcher { researcherId: row.ResearcherId }), (p: Product { productId: row.ProductId }) ' +
    'CREATE (r) - [: USING { isOwner: row.isOwner }] -> (p)');
}

function _importRelationshipActiveAt(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/ACTIVE_AT.csv" as row ' +
    'MATCH(r: Researcher { researcherId: row.ResearcherId }), (l: Lab { labId: row.LabId }) ' +
    'CREATE (r) - [: ACTIVE_AT { onResearchAreas: [], hasActiveProject: row.hasActiveProject }] -> (l)');
}

function _importRelationshipConducts(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/CONDUCTS.csv" as row ' +
    'MATCH(r: Research { researchId: row.ResearchId }), (rr: Researcher { researcherId: row.ResearcherId }) ' +
    'CREATE (r) < -[: CONDUCTS] - (rr)');
}

function _importRelationshipPartOf(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/PART_OF.csv" as row ' +
    'MATCH(l: Lab { labId: row.LabId }), (f: Faculty { facultyId: row.FacultyId }) ' +
    'CREATE (l) - [: PART_OF] -> (f)');
}

function _importRelationshipRelevantTo(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/RELEVANT_TO.csv" as row ' +
    'MATCH(r: Research { researchId: row.ResearchId }), (ra: ResearchArea { researchAreaId: row.ResearchAreaId }) ' +
    'CREATE (r) - [: RELEVANT_TO] -> (ra)');
}

function _importRelationshipUsedIn(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/USED_IN.csv" as row ' +
    'MATCH(rs: ResearchSetup { researchSetupId: row.ResearchSetupId }), (r: Research { researchId: row.ResearchId }) ' +
    'CREATE (rs) - [: USED_IN] -> (r)');
}

function _importRelationshipWroteRegardTo(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/WROTE_REGARD_TO.csv" as row ' +
    'MATCH(a: Article { articleId: row.ArticleId }), (r: Research { researchId: row.ResearchId }) ' +
    'CREATE (a) - [: WROTE_REGARD_TO] -> (r)');
}

function _importRelationshipComposedOf(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///relationship_tables/COMPOSED_OF.csv" as row ' +
    'MATCH(rs: ResearchSetup { researchSetupId: row.ResearchSetupId }), (p: Product { productId: row.ProductId }) ' +
    'CREATE (rs) - [: COMPOSED_OF] -> (p)');
}


//////////////////////////////////
/// Special Property Functions ///
//////////////////////////////////

function _importSpecialPropertyOnResearchAreas(tx) {
  return tx.run('LOAD CSV WITH HEADERS FROM "file:///special_property_tables/onResearchAreas.csv" as row ' +
    'MATCH(r: Researcher { researcherId: row.ResearcherId }) - [h: ACTIVE_AT] -> (l: Lab { labId: row.LabId }) ' +
    'SET h.onResearchAreas = h.onResearchAreas + row.ResearchAreaId');
}

////////////////////////
/// Import Functions ///
////////////////////////

function _importEntitiesData(session) {
  return session.writeTransaction(tx => _importEntityLabs(tx))
    .then(() => session.writeTransaction(tx => _importEntityResearchers(tx)))
    .then(() => session.writeTransaction(tx => _importEntityResearchAreas(tx)))
    .then(() => session.writeTransaction(tx => _importEntityProducts(tx)))
    .then(() => session.writeTransaction(tx => _importEntityFaculties(tx)))
    .then(() => session.writeTransaction(tx => _importEntityResearchSetups(tx)))
    .then(() => session.writeTransaction(tx => _importEntityResearches(tx)))
    .then(() => session.writeTransaction(tx => _importEntityArticles(tx)))
}

function _importRelationshipData(session) {
  return session.writeTransaction(tx => _importRelationshipWasResearchedAt(tx))
    .then(() => session.writeTransaction(tx => _importRelationshipUsedAt(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipResearches(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipUsing(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipActiveAt(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipConducts(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipPartOf(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipRelevantTo(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipUsedIn(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipWroteRegardTo(tx)))
    .then(() => session.writeTransaction(tx => _importRelationshipComposedOf(tx)))
}

function _importSpecialPropertyData(session) {
  return session.writeTransaction(tx => _importSpecialPropertyOnResearchAreas(tx))
}

function importGraphDatabase(session) {
  return _importEntitiesData(session)
    .then(() => _importRelationshipData(session))
    .then(() => _importSpecialPropertyData(session))
}

module.exports = {
    importGraphDatabase: importGraphDatabase
}