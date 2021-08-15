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

function createGraphConstraints(session) {
  return session.writeTransaction(tx => createConstraintLabId(tx))
    .then(() => session.writeTransaction(tx => createConstraintResearcherId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintProductId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintResearchAreaId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintFacultyId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintArticleId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintResearchId(tx)))
    .then(() => session.writeTransaction(tx => createConstraintResearchSetupId(tx)))
}

module.exports = {
    createGraphConstraints: createGraphConstraints
}