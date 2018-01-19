/**
 * GET /
 */
exports.index = function(req, res) {
  if(req.isAuthenticated()) {
    if(req.user.org) {
      res.redirect('/orgs/'+req.user.org+"/applications");
    } else {
      res.redirect('/orgs/new');
    }
  } else {
    res.render('home', {
      layout: 'anon-landing'
    })
  }
};
