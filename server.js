var express = require('express');
var path = require('path');
var logger = require('morgan');
var compression = require('compression');
var methodOverride = require('method-override');
var session = require('express-session');
var flash = require('express-flash');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var dotenv = require('dotenv');
var exphbs = require('express-handlebars');
var helpers = require('handlebars-helpers')();
var mongoose = require('mongoose');
var passport = require('passport');
var wildcardSubdomains = require('wildcard-subdomains')
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
// Load environment variables from .env file
//dotenv.load();

// Controllers
var HomeController = require('./controllers/home');
var userController = require('./controllers/user');
var orgController = require('./controllers/org');
var appController = require('./controllers/application');
var contactController = require('./controllers/contact');

// Passport OAuth strategies
require('./config/passport');

var app = express();


mongoose.connect(process.env.MONGOHQ_URL);
mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

var hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    ifeq: function(a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    toJSON : function(object) {
      return JSON.stringify(object);
    }
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(logger('dev'));
app.use(wildcardSubdomains({
  namespace: 's',
  whitelist: ['www', 'app', 'api']
}));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(methodOverride('_method'));
//app.use(cookieSession({keys: [process.env.SESSION_SECRET], resave: true, saveUninitialized: true, cookie: {signed: false, domain:'volunteercheck.org'}}));
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});

app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true, cookie: {domain:'.volunteercheck.org'} }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', HomeController.index);
app.get('/contact', contactController.contactGet);
app.post('/contact', contactController.contactPost);
app.get('/account', userController.ensureAuthenticated, userController.accountGet);
app.put('/account', userController.ensureAuthenticated, userController.accountPut);
app.delete('/account', userController.ensureAuthenticated, userController.accountDelete);
app.get('/signup', userController.signupGet);
app.post('/signup', userController.signupPost);
app.get('/login', userController.loginGet);
app.post('/login', userController.loginPost);
app.get('/forgot', userController.forgotGet);
app.post('/forgot', userController.forgotPost);
app.get('/reset/:token', userController.resetGet);
app.post('/reset/:token', userController.resetPost);
app.get('/logout', userController.logout);
app.get('/s/:subdomain/logout', userController.logout);
app.get('/unlink/:provider', userController.ensureAuthenticated, userController.unlink);

app.get('/s/:subdomain', orgController.showOrg);
app.get('/s/:subdomain/apply', appController.newApp);
app.post('/s/:subdomain/apply', appController.createApp);
app.get('/s/:subdomain/status', appController.appStatus);
app.get('/s/:subdomain/auth/facebook', orgController.authRedirect);

app.get('/orgs/:id/applications', appController.listApps);
app.get('/orgs/:id/applications/filter/:filter', appController.listApps);
app.get('/orgs/:id/applications/:app_id', appController.getApplication);
app.get('/orgs/:id/applications/:app_id/review', appController.updateApplication);

app.get('/orgs/new', orgController.newOrg);
app.get('/orgs/:id/edit', orgController.editOrg);
app.post('/orgs/:id/edit', orgController.updateOrg);
app.post('/orgs/new', orgController.createOrg);

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/auth/rewrite', failureRedirect: '/auth/rewrite' }));
app.get('/auth/rewrite', orgController.rewriteSubdomain);


//app.get('/s/:subdomain/auth/twitter', passport.authenticate('twitter'));
//app.get('/s/:subdomain/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/' }));

// Production error handler:
if (app.get('env') === 'production') {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.sendStatus(err.status || 500);
  });
}

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
