const express = require('express');
const router = express.Router();

const graphDBConnect = require('./graphDBConnect');

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

router.get('/labs', async function (req, res) {
    const session = graphDBConnect.getSession(req);
    var query = 
        'LOAD CSV WITH HEADERS FROM "file:///Labs.csv" as row \
        WITH row, split(row.ResearchAreas, ",") as researchAreas \
        UNWIND researchAreas as ra \
        MERGE(l: Lab { id: row.Id, name: row.Lab }) \
        MERGE(r: ResearchArea { name: ra }) \
        MERGE(l) < -[: WAS_RESEARCHED_AT] - (r) \
        RETURN l.id, l.name';
    var resultObj = await graphDBConnect.executeCypherQuery(session, query);
    const result = validateCsvImport(resultObj);
    res.send(result);
});

router.get('/researchers', async function (req, res) {
    const query = 
        'LOAD CSV WITH HEADERS FROM "file:///Researchers.csv" as row \
        WITH row, split(row.Labs, ",") as labs, split(row.ResearchAreas, ",") as researchAreas \
        UNWIND labs as lab \
        UNWIND researchAreas as ra \
        MERGE(r: Researcher { name: row.Researcher }) \
        MERGE(l: Lab { name: lab }) \
        MERGE(rsa: ResearchArea { name: ra }) \
        MERGE(r) - [: HAS_ACTIVE_PROJECT] -> (l) \
        MERGE(r) - [: RESEARCH] -> (rsa) \
        RETURN r.name, l.name';
    const session = graphDBConnect.getSession(req);
    var resultObj = await graphDBConnect.executeCypherQuery(session, query);
    const result = validateCsvImport(resultObj);
    res.send(result);
});

router.get('/products', async function (req, res) {
    const query = 
        'LOAD CSV WITH HEADERS FROM "file:///Products.csv" as row \
        WITH row, split(row.ResearchAreas, ",") as researchAreas \
        UNWIND researchAreas as ra \
        MERGE(p: Product { productID: row.ProductID, deviceID: row.DeviceID, \
            description: row.Description, manufacture: row.Manufacture, \
            dateCreated: row.DateCreated, endOfManufactureWarrenty: row.EndofManufactureWarrenty }) \
        MERGE(r: Researcher { name: row.Researcher }) \
        MERGE(l: Lab { name: row.Lab }) \
        MERGE(rsa: ResearchArea { name: ra }) \
        MERGE(r) - [: PURCHASED] -> (p) \
        MERGE(p) - [: USED_IN] -> (rsa) \
        MERGE(p) - [: USED_AT] -> (l) \
        RETURN p.productID, p.deviceID, p.description, p.manufacture';
    const session = graphDBConnect.getSession(req);
    var resultObj = await graphDBConnect.executeCypherQuery(session, query);
    const result = validateCsvImport(resultObj);
    res.send(result);
});

router.get('/delete_all', async function (req, res) {
    const session = graphDBConnect.getSession(req);
    var query = 'MATCH (n) DETACH DELETE n';
    var resultObj = await graphDBConnect.executeCypherQuery(session, query);
    // const result = validateCsvImport(resultObj);
    // res.send(result);
});


// exporting router
module.exports = router;