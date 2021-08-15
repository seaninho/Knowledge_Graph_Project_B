const labs = require('../routes/labs');
const researchers = require('../routes/reseachers');
const products = require('../routes/products');
const dbHandler = require('../middleware/graphDBHandler');

function route(app) {
    app.get("/database/import", dbHandler.importDataFromCsv);
    app.get("/database/export", dbHandler.exportDataToCsv);
    app.get("/database/delete", dbHandler.deleteDatabase);
    app.get("/labs/:id", labs.getLabById);
    app.get("/researchers/:id", researchers.getResearcherById);
    app.get("/products/:id", products.getProductById);
    app.get("/products/multiple", products.listAllMultiplePurchased);
}

module.exports = {
    route: route
}