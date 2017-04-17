var User = require('../models/User');
var Org = require('../models/Org');
var Application = require('../models/Application');

/**
 * GET subdomain.vettit.co/status
 */
exports.appStatus = function(req, res) {
  console.log("APPLICATION STATUS");

  Org.findOne({subdomain: req.params.subdomain}, function(err, theOrg) {
    if(theOrg && !req.isAuthenticated()) {
      res.redirect("/")
    } else if(theOrg) {
      //Check to see if there is an application in progress for this user
      Application.findOne({org: theOrg._id, user: req.user._id}, function(err, theApp) {
        if(!theApp) {
          res.redirect('/apply');
        } else {
          res.render('org/status', {
            org: theOrg,
            app: theApp,
            layout: 'main'
          });
        }
      });
    } else {
      res.send(404);
    }
  })
};

/**
 * GET subdomain.vettit.co/apply
 */
exports.newApp = function(req, res) {
  Org.findOne({subdomain: req.params.subdomain}, function(err, theOrg) {
    if(theOrg && !req.isAuthenticated()) {
      res.redirect('/');
    } else if(theOrg) {
      //Check to see if there is an application in progress for this user
      Application.findOne({org: theOrg._id, user: req.user._id}, function(err, theApp) {
        if(!theApp) {
          theApp = new Application();
          res.render('org/application', {
            title: "Apply to " + theOrg.name,
            org: theOrg,
            app: theApp,
            layout: 'main'
          });
        } else {
          res.redirect('/status');
        }
      });
    } else {
      res.send(404);
    }
  })
}

/**
 * POST subdomain.vettit.co/apply
 */
exports.createApp = function(req, res) {
  console.log(req.body);

  Org.findOne({subdomain: req.params.subdomain}, function(err, theOrg) {
    if(theOrg && !req.isAuthenticated()) {
      res.redirect('/');
    } else if(theOrg) {
      //Check to see if there is an application in progress for this user
      Application.findOne({org: theOrg._id, user: req.user._id}, function(err, theApp) {
        if(!theApp) {
          theApp = new Application();
          theApp.org = theOrg;
          theApp.user = req.user;
          theApp.reviewed = false;
          theApp.accepted = false;

          theApp.save(function(err) {
            if(!err) {
              res.redirect("/status");
            } else {
              console.log(err);
              res.redirect('/apply');
            }
          })
        } else {
          res.redirect('/status');
        }
      });
    } else {
      res.send(404);
    }
  })
};

/*
 * GET /orgs/:id/applications
 */
exports.listApps = function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, theUser) {
      if(theUser.org == req.params.id) {
        Application.find({'org': req.params.id}).populate('user').exec(function(err, theApps) {
          if(!err) {
            console.log(theApps);
            res.render('org/application-list', {
              title: 'Applications',
              orgId: req.params.id,
              apps: theApps
            });
          } else {
            console.log(err);
            res.send(500);
          }
        });
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.redirect('/login');
  }
};

/*
 * GET /orgs/:id/applications/:app_id
 */
exports.getApplication = function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, theUser) {
      if(theUser.org == req.params.id) {
        Application.findById(req.params.app_id).populate('user').exec(function(err, theApp) {
          if(!err) {
            console.log(theApp);
            var theResponses = [];
            if(theApp.responsesJSON) {
              theResponses = JSON.parse(theApp.responsesJSON);
            }

            res.render('org/show-application', {
              title: 'Applications',
              app: theApp,
              responses: theResponses
            });
          } else {
            console.log(err);
            res.send(500);
          }
        });
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.redirect('/login');
  }
};

/*
 * POST /orgs/:id/applications/:app_id
 */
exports.updateApplication = function(req, res) {
  res.redirect("/");
};
