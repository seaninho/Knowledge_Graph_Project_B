const express = require('express');
const cookieParser = require('cookie-parser');
const morganLogger = require('morgan');
const path = require('path');

const { NotFound } = require('./utils/errors');
const homepage = require('./routes/index');
const router = require('./startup/routes');
const config = require('./startup/config');
const exceptionHandler = require('./middleware/exceptionHandler');
const errorHandler = require('./middleware/errorHandler');

config.assertHostAlive();

var app = express();
exceptionHandler();

app.use('/', homepage);

// app configurations
app.use(express.urlencoded({ extended: false }));
// public folder will be a static folder (e.g. holds images)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(morganLogger('dev'));
app.use(cookieParser());

// views folder will hold all views
app.set('views', path.join(__dirname, 'views'));
// view engine setup
app.set('view engine', 'ejs');

app.set('json spaces', 1);

// routing
router(app);

// catch 404 and forward to our error handler
app.use((_req, _res, next) => {
  next(new NotFound());
});

//error handling 
app.use(errorHandler);

module.exports = app;