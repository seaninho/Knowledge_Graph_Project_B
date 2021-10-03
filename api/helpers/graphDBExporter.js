var fs = require('fs');

var exportDirectory = undefined;
var entityExportDirectory = undefined;
var relationshipExportDirectory = undefined;
var specialPropertyExportDirectory = undefined;

////////////////////////
/// Entity Functions ///
////////////////////////

function _exportEntityLabs(tx) {
  return tx.run('WITH "MATCH path = (l:Lab) ' +
    'RETURN l.labId AS labId, l.labName AS labName" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + entityExportDirectory + '/Lab.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportEntityResearchers(tx) {
  return tx.run('WITH "MATCH path = (r:Researcher) ' +
    'RETURN r.researcherId AS researcherId, r.researcherName AS researcherName" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + entityExportDirectory + '/Researcher.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportEntityResearchAreas(tx) {
  return tx.run('WITH "MATCH path = (ra:ResearchArea) ' +
    'RETURN ra.researchAreaId as researchAreaId, ra.researchAreaName AS researchAreaName" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + entityExportDirectory + '/ResearchArea.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportEntityProducts(tx) {
  return tx.run('WITH "MATCH path = (p:Product) ' +
    'RETURN p.productId AS productId, p.deviceId AS deviceId, ' +
      'p.productDescription as productDescription, p.productManufacture as productManufacture, ' +
      'p.productDateCreated as productDateCreated, ' +
      'p.endOfManufactureWarrenty as endOfManufactureWarrenty, ' +
      'p.isActiveProduct as isActiveProduct" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + entityExportDirectory + '/Product.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportEntityFaculties(tx) {
  return tx.run('WITH "MATCH path = (f:Faculty) ' +
    'RETURN f.facultyId AS facultyId, f.facultyName AS facultyName" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + entityExportDirectory + '/Faculty.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportEntityArticles(tx) {
  return tx.run('WITH "MATCH path = (p:Article) ' +
    'RETURN p.articleId AS articleId, p.URL AS URL" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + entityExportDirectory + '/Article.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportEntityResearches(tx) {
  return tx.run('WITH "MATCH path = (r:Research) ' +
    'RETURN r.researchId as researchId, r.researchName AS researchName" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + entityExportDirectory + '/Research.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data')
}

function _exportEntityResearchSetups(tx) {
  return tx.run('WITH "MATCH path = (rs:ResearchSetup) ' +
    'RETURN rs.researchSetupId as researchSetupId, ' +
      'rs.researchSetupName AS researchSetupName" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + entityExportDirectory + '/ResearchSetup.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

//////////////////////////////
/// Relationship Functions ///
//////////////////////////////

function _exportRelationshipWasResearchedAt(tx) {
  return tx.run('WITH "MATCH path = (ra:ResearchArea)-[:WAS_RESEARCHED_AT]->(l:Lab) ' +
    'RETURN ra.researchAreaId as ResearchAreaId, l.labId AS LabId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/WAS_RESEARCHED_AT.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipUsedAt(tx) {
  return tx.run('WITH "MATCH path = (p:Product)-[:USED_AT]->(l:Lab) ' +
    'RETURN p.productId as ProductId, l.labId AS LabId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/USED_AT.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipResearches(tx) {
  return tx.run('WITH "MATCH path = (r:Researcher)-[:RESEARCHES]->(ra:ResearchArea) ' +
    'RETURN r.researcherId as ResearcherId, ra.researchAreaId AS ResearchAreaId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/RESEARCHES.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipUsing(tx) {
  return tx.run('WITH "MATCH path = (r:Researcher)-[:USING]->(p:Product) ' +
    'RETURN r.researcherId as ResearcherId, p.productId AS ProductId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/USING.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipActiveAt(tx) {
  return tx.run('WITH "MATCH path = (r:Researcher)-[:ACTIVE_AT]->(l:Lab) ' +
    'RETURN r.researcherId as ResearcherId, l.labId AS LabId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/ACTIVE_AT.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipConducts(tx) {
  return tx.run('WITH "MATCH path = (rr:Researcher)-[:CONDUCTS]->(r:Research) ' +
    'RETURN rr.researcherId as ResearcherId, r.researchId AS ResearchId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/CONDUCTS.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipPartOf(tx) {
  return tx.run('WITH "MATCH path = (l:Lab)-[:PART_OF]->(f:Faculty) ' +
    'RETURN l.labId as LabId, f.facultyId AS FacultyId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/PART_OF.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipRelevantTo(tx) {
  return tx.run('WITH "MATCH path = (r:Research)-[:RELEVANT_TO]->(ra:ResearchArea) ' +
    'RETURN r.researchId as ResearchId, ra.researchAreaId AS ResearchAreaId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/RELEVANT_TO.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipUsedIn(tx) {
  return tx.run('WITH "MATCH path = (rs:ResearchSetup)-[:USED_IN]->(r:Research) ' +
    'RETURN rs.researchSetupId as ResearchSetupId, r.researchId AS ResearchId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/USED_IN.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipWroteRegardTo(tx) {
  return tx.run('WITH "MATCH path = (p:Article)-[:WROTE_REGARD_TO]->(r:Research) ' +
    'RETURN p.articleId as ArticleId, r.researchId AS ResearchId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/WROTE_REGARD_TO.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

function _exportRelationshipComposedOf(tx) {
  return tx.run('WITH "MATCH path = (rs:ResearchSetup)-[:COMPOSED_OF]->(p:Product) ' +
    'RETURN rs.researchSetupId as ResearchSetupId, p.productId AS ProductId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + relationshipExportDirectory + '/COMPOSED_OF.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

//////////////////////////////////
/// Special Property Functions ///
//////////////////////////////////

function _exportSpecialPropertyHasActiveProject(tx) {
  return tx.run('WITH "MATCH path = (r:Researcher)-[h:ACTIVE_AT]->(l:Lab) ' +
    'UNWIND h.onResearchAreas as H ' +
	  'RETURN r.researcherId as ResearcherId, l.labId as LabId, H as ResearchAreaId" AS query ' +
    'CALL apoc.export.csv.query(query, "/' + specialPropertyExportDirectory + '/onResearchAreas.csv", {}) ' +
    'YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data ' +
    'RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data');
}

////////////////////////
/// Export Functions ///
////////////////////////

function _exportEntitiesData(session) {
  return session.writeTransaction(tx => _exportEntityLabs(tx))
    .then(() => session.writeTransaction(tx => _exportEntityResearchers(tx)))
    .then(() => session.writeTransaction(tx => _exportEntityResearchAreas(tx)))
    .then(() => session.writeTransaction(tx => _exportEntityProducts(tx)))
    .then(() => session.writeTransaction(tx => _exportEntityFaculties(tx)))
    .then(() => session.writeTransaction(tx => _exportEntityResearchSetups(tx)))
    .then(() => session.writeTransaction(tx => _exportEntityResearches(tx)))
    .then(() => session.writeTransaction(tx => _exportEntityArticles(tx)))
}

function _exportRelationshipData(session) {
  return session.writeTransaction(tx => _exportRelationshipWasResearchedAt(tx))
    .then(() => session.writeTransaction(tx => _exportRelationshipUsedAt(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipResearches(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipUsing(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipActiveAt(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipConducts(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipPartOf(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipRelevantTo(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipUsedIn(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipWroteRegardTo(tx)))
    .then(() => session.writeTransaction(tx => _exportRelationshipComposedOf(tx)))
}

function _exportSpecialPropertyData(session) {
  return session.writeTransaction(tx => _exportSpecialPropertyHasActiveProject(tx))
}

function exportGraphDatabase(session, exportDirectoryBase) {
  var todayDate = new Date().toISOString().slice(0, 10);
  exportDirectory = exportDirectoryBase.replace(/\\/g,'/') + '/' + todayDate;
  entityExportDirectory = exportDirectory + '/' + 'entity_tables';
  relationshipExportDirectory = exportDirectory + '/' + 'relationship_tables';
  specialPropertyExportDirectory = exportDirectory + '/' + 'special_property_tables';

  var exportDirectories = [entityExportDirectory, relationshipExportDirectory, specialPropertyExportDirectory];
  for (const dir of exportDirectories) {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
  }  

  return _exportEntitiesData(session)
    .then(() => _exportRelationshipData(session))
    .then(() => _exportSpecialPropertyData(session))
    .then(() => {
      return exportDirectory.replace(/\//g,'\\');
    });
}


module.exports = {
    exportGraphDatabase: exportGraphDatabase
}