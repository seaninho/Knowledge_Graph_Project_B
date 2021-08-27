const dbHandler = require('../middleware/graphDBHandler');
const entity = require('../models/entity');


function route(app) {
    app.get("/database/import", dbHandler.importDataFromCsv);
    app.get("/database/export", dbHandler.exportDataToCsv);
    app.get("/database/delete", dbHandler.deleteDatabase);
    app.get("/entity/types", entity.getAllEntityTypes);
    app.get("/entity/:entity", entity.getAllEntitiesByType);
    app.get("/entity/:entity/:id", entity.getEntityById);     
    app.get("/scheme/:entity", entity.getScheme);
}

module.exports = {
    route: route
}