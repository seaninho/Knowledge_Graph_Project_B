const dbHandler = require('../middleware/graphDBHandler');
const entity = require('../models/entity');
const articles = require("../routes/articles");
const faculties = require('../routes/faculties');
const labs = require('../routes/labs');
const researchAreas = require('../routes/researchAreas');
const researchers = require('../routes/reseachers');
const researches = require('../routes/researches');
const researchSetups = require('../routes/researchSetups');
const products = require('../routes/products');

function route(app) {
    app.get("/article", articles.listAllArticles);
    app.get("/article/:id", articles.getArticleById);
    app.get("/database/import", dbHandler.importDataFromCsv);
    app.get("/database/export", dbHandler.exportDataToCsv);
    app.get("/database/delete", dbHandler.deleteDatabase);
    app.get("/faculty", faculties.listAllFaculties);    
    app.get("/faculty/:id", faculties.getFacultyById);
    app.get("/lab", labs.listAllLabs);
    app.get("/lab/:id", labs.getLabById);
    app.get("/product", products.listAllProducts);
    app.get("/product/:id", products.getProductById);
    app.get("/research", researches.listAllResearches);
    app.get("/research/:id", researches.getResearchById);
    app.get("/researchArea", researchAreas.listAllResearchAreas);
    app.get("/researchArea/:id", researchAreas.getResearchAreaById);
    app.get("/researcher", researchers.listAllResearchers);
    app.get("/researcher/:id", researchers.getResearcherById);
    app.get("/researchSetup", researchSetups.listAllResearchSetups);
    app.get("/researchSetup/:id", researchSetups.getResearchSetupById);
    app.get("/scheme/:entity", entity.getScheme);
}

module.exports = {
    route: route
}