const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
const createError = require('http-errors');
const winston = require('winston');

const homepage = require('./routes/index');
const router = require('./startup/routes');
const config = require('./startup/config');
const error = require('./middleware/error');

config.assertHostAlive();

var app = express();
require('./startup/logging')();

app.use('/', homepage);

// app configurations
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(logger('dev'));
app.use(cookieParser());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('json spaces', 1);

// routing
router(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

//error handling 
app.use(error);

module.exports = app;