const dbHandler = require('../middleware/graphDBHandler');
const entity = require('../models/entity');


function route(app) {
    // GET REQUEST
    app.get('/', function(_req, res, _next) {
        res.render('index', { title: 'HOME' });
    });  
    app.get("/entity/types", dbHandler.getAllEntityTypes);
    app.get("/entity/:entity", entity.getAllEntitiesByType);
    app.get("/entity/:entity/:id", entity.getEntityById); 
    app.get("/relationship/types", dbHandler.getAllRelationshipTypes);
    app.get("/scheme/:entity", entity.getEntityScheme);
    app.get("/search/:entity", entity.searchForEntity);
    // PUT REQUEST
    app.put("/entity/:entity/:id", entity.setEntityProperties);
    // POST REQUEST
    app.post("/database/restore", dbHandler.importDatabase);
    app.post("/database/export", dbHandler.exportDataToCsv);
    app.post("/database/delete", dbHandler.deleteDatabase);
    app.post("/database/create", dbHandler.createDatabaseFiles);
    app.post("/entity/:entity", entity.addEntity);
    app.post("/entity/:entity/:id", entity.addEntityRelationship);
}

module.exports = {
    route: route
}