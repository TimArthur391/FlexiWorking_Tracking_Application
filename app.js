var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var compression = require('compression')
const session = require('express-session');
const controller = require('./controllers/controller');


var master_router = require('./routes/index');

var app = express();

// view engine setup
app
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

// modules to use
app
  .use(logger('dev'))
  .use(compression())
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(cookieParser())
  .use(express.static(path.join(__dirname, 'public')))
  .use(session({
    secret : 'secret',
    resave : false ,
    store: controller.sessionStore,
    cookie: { 
      httpOnly: true,
      sameSite: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 
    },
    saveUninitialized : true,
    endConnectionOnClose: true
  }));

//routes
app.use('/', master_router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
