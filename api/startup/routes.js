const dbHandler = require('../middleware/graphDBHandler');
const entity = require('../models/entity');

function route(app) {
    // GET REQUEST
    app.get('/', function (_req, res, _next) {
        res.render('index', { title: 'HOME' });
    });
    app.get('/entity/types', dbHandler.getAllEntityTypes);
    app.get('/entity/:entity', entity.getAllEntitiesByType);
    app.get('/entity/:entity/:id', entity.getEntityById);
    app.get('/relationship/types', dbHandler.getAllRelationshipTypes);
    app.get('/scheme/:entity', entity.getEntityScheme);
    app.get('/search/:entity', entity.searchForEntity);
    // PUT REQUEST
    app.put('/entity/:entity/:id', entity.setEntityProperties);
    // POST REQUEST
    app.post('/database/restore', dbHandler.restoreDatabase);
    app.post('/database/backup', dbHandler.backupDatabase);
    app.post('/database/delete', dbHandler.deleteDatabase);
    app.post('/database/initialize', dbHandler.initializeDatabase);
    app.post('/database/update', dbHandler.updateDatabase);
    app.post('/entity/:entity', entity.addEntity);
    app.post('/entity/:entity/:id', entity.addEntityRelationship);
}

module.exports = {
    route: route,
};
