var User = require('../models/User');
var Org = require('../models/Org');
var Application = require('../models/Application');
var json2csv = require('json2csv');

/**
 * GET subdomain.volunteercheck.co/status
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
 * GET subdomain.volunteercheck.co/apply
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
 * POST subdomain.volunteercheck.co/apply
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
          theApp.responsesJSON = req.body.surveyResponses;

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
        Org.findById(req.params.id, function(err, theOrg) {
            if(!err) {
                //Use query string to find out how we should filter the list
                var q = {};
                var all = false;
                var toReview = false
                var accepted = false;
                var rejected = false;
                if(req.params.filter == "all") {
                  all = true;
                  q = {'org': req.params.id};
                } else if(req.params.filter == "accepted") {
                  accepted = true;
                  q = {'org': req.params.id, 'accepted': true};
                } else if(req.params.filter == "rejected") {
                  rejected = true;
                  q = {'org': req.params.id, 'accepted': false, 'reviewed': true};
                } else {
                  toReview = true;
                  q = {'org': req.params.id, 'reviewed': false};
                }

                Application.find(q).populate('user').exec(function(err, theApps) {
                  if(!err) {
                    res.render('org/application-list', {
                      title: 'Review Applications',
                      orgId: req.params.id,
                      apps: theApps,
                      filterAll: all,
                      filterAccepted: accepted,
                      filterRejected: rejected,
                      filterReview: toReview,
                      empty: theApps.length == 0,
                      subdomain: theOrg.subdomain
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
 * GET /orgs/:id/applications/:app_id/review?approved=true/false
 */
exports.updateApplication = function(req, res) {
  console.log("--> Updating application")
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, theUser) {
      if(theUser.org == req.params.id) {
        Application.findById(req.params.app_id).populate('user').exec(function(err, theApp) {
          if(!err) {
            console.log("--> Found app, no error")
            if(req.query.approved != undefined) {
              if(req.query.approved) {
                theApp.accepted = true;
                theApp.reviewed = true;
              } else {
                theApp.accepted = false;
                theApp.reviewed = true;
              }

              theApp.save(function(err) {
                if(err) {
                  console.log(err);
                  res.send(500);
                } else {
                  console.log("Set approval state on application " + req.params.app_id +" to " + req.query.approved);
                  res.redirect("/orgs/"+req.params.id+"/applications/");
                }
              });
            } else {
              //No query parameter for redirect
              res.redirect("/orgs/"+req.params.id+"/applications/"+req.params.app_id);
            }
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
 * GET /orgs/:id/applications/out/applications.csv
 */

exports.csvOutput = function(req, res){
  if(req.isAuthenticated()){
    console.log('hi there '+ req.user.id + ':' + req.params.id);
    User.findById(req.user.id, function(err, theUser){
      if(err){
        console.log(err);
        res.redirect('/');
      }
      if(theUser.org != req.params.id){
        console.log(err);
        res.sendStatus(403);
      }
      if(theUser && theUser.admin){
        console.log("Good user: fetching applications");
        res.setHeader('Content-disposition', 'attachment; filename=' + 'applicants.csv');
        res.setHeader('Content-type', 'text/csv');

        app_query = Application.find({'org': req.params.id}).populate('user');
        app_query.exec(function(err, apps){
          if(!err){
            console.info("That happened: " + apps.length);

            fields = [
              'name',
              'email',
              'reviewed',
              'accepted'
            ]

            data = []
            for(indx in apps){
              var app = apps[indx];
              console.log(app);
              var answers = JSON.parse(app.responsesJSON);
              if(app.user){
                var row = {
                  'name': app.user.name,
                  'email': app.user.email,
                  'reviewed': app.reviewed,
                  'accepted': app.accepted
                };

                for (ans_indx in answers){
                  var ans = answers[ans_indx];
                  if (fields.indexOf(ans.question) == -1){
                    fields.push(ans.question);
                  }
                  row[ans.question] = ans.answer;
                }
                console.log(row);
                data.push(row);
              }else {
                console.log('App: ' + app.id + ' does not reference a valid user');
              }
            }
            var csv = json2csv({ 'data': data, 'fields': fields });
            res.write(csv);
            res.end()
          } else{
            console.log(err);
            res.sendStatus(500);
          }
        });
      }else{
        console.log('CSV requested by non admin');
      }
    });

  }
};
