const express = require('express');
const labs = require('../routes/labs');
const researchers = require('../routes/reseachers');
const products = require('../routes/products');
const dbHandler = require('../middleware/graphDBHandler');
const error = require('../middleware/error');

module.exports = function (app) {
    app.use(express.json());
    app.set('json spaces', 1);
    app.use(error);
    app.get("/database/load", dbHandler.loadDataFromCsv);
    app.get("/database/delete", dbHandler.deleteDatabase);
    app.get("/labs", labs.listAllLabs);
    app.get("/labs/:id", labs.getById);
    app.get("/labs/:id/researchers", labs.listAllResearchersInLab);
    app.get("/labs/:id/research_areas", labs.listAllResearcheAreasInLab);
    app.get("/labs/:id/products", labs.listAllProductsUsedInLab);
    app.get("/researchers", researchers.listAllResearchers);
    app.get("/researchers/:id", researchers.getById);
    app.get("/researchers/:id/research_areas", researchers.listAllResearchedAreasByResearcher);
    app.get("/products", products.listAllProducts);
    app.get("/products/:id", products.getById);
    app.get("/products/:id/labs", products.listAllLabsThatUseProductId);
    app.get("/products/:id/researchers", products.listAllResearchersThatPurchasedProductId);
    app.get("/products/:id/research_areas", products.listAllResearchAreasThatUseProductId);
    app.get("/products/multiple", products.listAllMultiplePurchased);
};