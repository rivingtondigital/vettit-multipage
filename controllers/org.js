var User = require('../models/User');
var Org = require('../models/Org');
var Application = require('../models/Application');

var config = require('../config/settings');


/**
 * GET subdomain.volunteercheck.co/
 */
exports.showOrg = function(req, res) {
  console.log("SHOW ORG");
  console.log(req.params.subdomain);
  //res.clearCookie("session");
  console.info(req.user);

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
      res.redirect('/logout');
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
      console.log(theUser.org, req.params.id);
      if(theUser.org == req.params.id) {
        Org.findById(req.params.id, function(err, org) {
          if(!err) {
            console.log(org);
            res.render('org/edit-org', {
              title: 'Organization Settings',
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

exports.authRedirect = function(req, res) {
  console.log("")
  console.log("AUTH REDIRECT: (" + req.params.subdomain + ")" + config.domain + "<-" + req.params.provider);
  res.clearCookie("session");
  res.cookie('auth_subdomain', req.params.subdomain, { domain: "." + config.domain });
  res.redirect(config.protocol + config.domain +'/auth/' + req.params.provider);
};


exports.rewriteSubdomain = function(req, res) {
  console.log(req.cookies);
  console.log(req.isAuthenticated());
  var cookieSubdomain = req.cookies['auth_subdomain'];
  if(cookieSubdomain && cookieSubdomain.length) {
      console.log("Found subdomain: " + cookieSubdomain);
      res.clearCookie("auth_subdomain");
      res.redirect(config.protocol + cookieSubdomain + "." + config.domain);
  } else {
    console.log("Didn't find a subdomain cookie - Maybe it expired?");
    res.redirect("/");
  }
};

exports.stripSubdomain = function(req, res){
  parts = req.path.split('/');
  less = parts.slice(3, parts.length).join('/');
  res.redirect(config.protocol + config.domain + '/' + less);
}
