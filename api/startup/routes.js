const labs = require('../routes/labs');
const researchers = require('../routes/reseachers');
const products = require('../routes/products');
const dbHandler = require('../middleware/graphDBHandler');

module.exports = function (app) {
    app.get("/database/load", dbHandler.loadDataFromCsv);
    app.get("/database/delete", dbHandler.deleteDatabase);
    app.get("/labs", labs.listAllLabs);
    app.get("/labs/:id", labs.getLabById);
    app.get("/labs/:id/researchers", labs.listAllResearchersInLab);
    app.get("/labs/:id/research_areas", labs.listAllResearcheAreasInLab);
    app.get("/labs/:id/products", labs.listAllProductsUsedInLab);
    app.get("/researchers", researchers.listAllResearchers);
    app.get("/researchers/:id", researchers.getResearcherById);
    app.get("/researchers/:id/labs", researchers.listAllLabsWithActiveResearchByResearcher);
    app.get("/researchers/:id/products", researchers.listAllProductsPurchasedByResearcher);
    app.get("/researchers/:id/research_areas", researchers.listAllResearchedAreasByResearcher);
    app.get("/products", products.listAllProducts);
    app.get("/products/:id", products.getProductById);
    app.get("/products/:id/labs", products.listAllLabsThatUseProductById);
    app.get("/products/:id/researchers", products.listAllResearchersThatPurchasedProductById);
    app.get("/products/:id/research_areas", products.listAllResearchAreasThatUseProductById);
    app.get("/products/multiple", products.listAllMultiplePurchased);
};