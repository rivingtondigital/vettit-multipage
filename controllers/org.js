var User = require('../models/User');
var Org = require('../models/Org');
var Application = require('../models/Application');

/**
 * GET subdomain.vettit.co/
 */
exports.showOrg = function(req, res) {
  Org.findOne({subdomain: req.params.subdomain}, function(err, theOrg) {
    if(theOrg && !req.isAuthenticated()) {
      res.render('landingpage', {
        org: theOrg,
        layout: 'org-landing'
      });
    } else if(theOrg) {
      //Check to see if there is an application in progress for this user
      Application.findOne({org: theOrg._id, user: req.user._id}, function(err, theApp) {
        if(!theApp) {
          res.redirect('/apply');
        } else {
          res.redirect('/status');
        }
      });
    } else {
      res.send(404);
    }
  })
};

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

/**
 * GET /orgs/new
 */
exports.newOrg = function(req, res) {
  console.log(req.user);
  if (req.isAuthenticated()) {
    console.log(req.user);
    if(req.user.admin) {
      res.render('org/create-org', {
        title: 'New Organization'
      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
};

/**
 * POST /orgs/new
 */
exports.createOrg = function(req, res) {
  if (req.isAuthenticated()) {
    console.log(req);

    var newOrg = new Org({
      name: req.body.orgName,
      location: req.body.orgLocation,
      tagline: req.body.orgTagline,
      about: req.body.orgAbout,
      heroImg: req.body.orgHero,
      iconImg: req.body.orgIcon,
      website: req.body.orgWebsite,
      facebook: req.body.orgFacebook,
      twitter: req.body.orgTwitter,
      survey: req.body.orgSurvey,
      subdomain: req.body.orgSubdomain
    });

    newOrg.save(function(err) {
      if(!err) {
        User.findById(req.user.id, function(err, theUser) {
          theUser.org = newOrg._id;
          theUser.save(function(err) {
            res.redirect("/");
          });
        });
      } else {
        res.redirect("/orgs/new");
      }
    });
  } else {
    res.redirect('/login');
  }
};

/**
 * GET /orgs/:id/edit
 */
exports.editOrg = function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, theUser) {
      if(theUser.org == req.params.id) {
        Org.findById(req.params.id, function(err, org) {
          if(!err) {
            console.log(org);
            res.render('org/edit-org', {
              title: 'Manage Organization',
              org: org
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

/**
 * POST /orgs/:id
 */
exports.updateOrg = function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, theUser) {
      if(theUser.org == req.params.id) {
        Org.findById(req.params.id, function(err, org) {
          if(!err) {

            org.name = req.body.orgName;
            org.location = req.body.orgLocation;
            org.tagline = req.body.orgTagline;
            org.about = req.body.orgAbout;
            org.heroImg = req.body.orgHero;
            org.iconImg = req.body.orgIcon;
            org.website = req.body.orgWebsite;
            org.facebook = req.body.orgFacebook;
            org.twitter = req.body.orgTwitter;
            org.survey = req.body.orgSurvey;
            org.subdomain = req.body.orgSubdomain;

            org.save(function(err) {
              if(!err) {
                res.redirect("/");
              } else {
                console.log(err);
                res.send(500);
              }
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
