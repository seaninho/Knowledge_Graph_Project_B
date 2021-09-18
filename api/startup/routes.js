const dbHandler = require('../middleware/graphDBHandler');
const entity = require('../routes/entity');


function route(app) {
    // GET REQUEST
    app.get("/database/import", dbHandler.importDataFromCsv);
    app.get("/database/export", dbHandler.exportDataToCsv);
    app.get("/database/delete", dbHandler.deleteDatabase);
    app.get("/entity/types", entity.getAllEntityTypes);
    app.get("/entity/:entity", entity.getAllEntitiesByType);
    app.get("/entity/:entity/:id", entity.getEntityById); 
    app.get("/relationship/types", entity.getAllRelationshipTypes);
    app.get("/scheme/:entity", entity.getEntityScheme);
    app.get("/search/:entity", entity.searchForEntity);
    // PUT REQUEST
    app.put("/entity/:entity/:id", entity.setEntityProperties);
    // POST REQUEST
    app.post("/entity/:entity/:id", entity.addEntityRelationship);
}

module.exports = {
    route: route
}