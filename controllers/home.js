/**
 * GET /
 */
exports.index = function(req, res) {
  if(req.isAuthenticated()) {
    res.render('home', {
      title: 'Home'
    });
  } else {
    res.render('layouts/anon-landing')
  }
};
