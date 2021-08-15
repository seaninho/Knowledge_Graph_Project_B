const dbHandler = require('../middleware/graphDBHandler');
const faculties = require('../routes/faculties');
const labs = require('../routes/labs');
const researchAreas = require('../routes/researchAreas');
const researchers = require('../routes/reseachers');
const researches = require('../routes/researches');
const researchSetups = require('../routes/researchSetups');
const products = require('../routes/products');

function route(app) {
    app.get("/database/import", dbHandler.importDataFromCsv);
    app.get("/database/export", dbHandler.exportDataToCsv);
    app.get("/database/delete", dbHandler.deleteDatabase);
    app.get("/faculties/:id", faculties.getFacultyById)
    app.get("/labs/:id", labs.getLabById);
    app.get("/researchers/:id", researchers.getResearcherById);
    app.get("/researchAreas/:id", researchAreas.getResearchAreaById);
    app.get("/researches/:id", researches.getResearchById);
    app.get("/researchSetups/:id", researchSetups.getResearchSetupById);
    app.get("/products/:id", products.getProductById);
}

module.exports = {
    route: route
}