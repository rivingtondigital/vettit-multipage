var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

var User = require('../models/User');

var config = require('../config/settings');


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Sign in with Email and Password
passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {
  User.findOne({ email: email }, function(err, user) {
    if (!user) {
      return done(null, false, { msg: 'The email address ' + email + ' is not associated with any account. ' +
      'Double-check your email address and try again.' });
    }
    user.comparePassword(password, function(err, isMatch) {
      if (!isMatch) {
        return done(null, false, { msg: 'Invalid email or password' });
			}
      return done(null, user);
    });
  });
}));

passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_ID,
    clientSecret: process.env.LINKEDIN_SECRET,
    callbackURL: config.protocol + config.domain + "/auth/linkedin/callback",
    scope: ['r_emailaddress', 'r_basicprofile'],
    state: true,
    profileFields: [
    "id",
    "first-name",
    "last-name",
    "email-address",
    "headline",
    "summary",
    "industry",
    "picture-url",
    "positions",
    "public-profile-url",
    "location"
    ],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, data, done){
    console.info('<<LINKEDIN REPLY>>');
    console.info(data);
    var raw = JSON.parse(data._raw);
    console.log(raw);
    console.log('-----------');
    profile = data._json;
    var userdata = {
      'source': 'linkedin',
      'id': profile.id,
      'email': profile.emailAddress,
      'name': profile.firstName + ' ' + profile.lastName,
      'location': profile.location.name,
      'picture': profile.pictureUrl,
      'link': profile.publicProfileUrl
    };
    var auth_id_qry = {'linkedin': profile.id}
    console.log(userdata);

    process_auth_data(req, userdata, auth_id_qry, done);
}));


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: config.protocol + config.domain + "/auth/google/callback",
    profileFields: ['name', 'email', 'gender', 'location', 'link', 'birthday', 'age_range'],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, data, done) {
    console.log("<<<GOOGLE REPLY>>>>");
    profile = data._json;

    var userdata = {
      'source': 'google',
      'id': profile.id,
      'name': profile.name.givenName + " " + profile.name.familyName,
      'link': profile.url,
      'birthday': profile.birthday
    };

    for (email in profile.emails){
      if (profile.emails[email].type == 'account'){
        userdata.email = profile.emails[email].value;
      }
    }

    if(profile.image){
      userdata.picture = profile.image.url;
    }

    range = profile.ageRange;
    if(range){
      if(range.min && range.max){
        userdata.age_range = range.min +" - "+ range.max;
      } else if(range.min){
        userdata.age_range = range.min + " or over";
      } else if(range.max){
        userdata.age_range = "Under " + range.max;
      }else{
        userdata.age_range = ""
      }
    }

    var auth_id_qry = {'google': profile.id}
    console.info(userdata);
    console.info('_________________');
    process_auth_data(req, userdata, auth_id_qry, done);

  })
);


function process_auth_data(req, data, auth_id_qry, done){
  console.log(data);
  if(req.user){
    console.info("Linking a logged in user.");
    User.findOne(auth_id_qry, function(err, user) {
      if(user){
        console.info(data.source + " account already linked to user.");
        req.flash('error', { msg: 'That ' + data.source + ' account has already been linked.' });
        return done(err, user);
      }else{
        console.info("Updating our records with anything new from the user.");
        User.findById(req.user.id, function(err, user) {
          user.name = user.name || data.name;
          user.gender = user.gender || data.gender;
          user.picture = user.picture || data.picture;
          user.link = user.link || data.link;
          user.birthday = user.birthday || data.birthday;
          user.age_range = user.age_range || data.age_range;

          user.set(data.source) = data.id;
          user.save(function(err) {
            req.flash('success', { msg: 'Your' + data.source + ' account has been linked.' });
            return done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne(auth_id_qry, function(err, user) {
      if(user){
        console.info("Found the right user");
        return done(err, user);
      } else {
        User.findOne({ email: data.email }, function(err, user) {
          if(user){
            console.info("Found the wrong user.");
            req.flash('error', { msg: user.email + ' is already associated with another account.' });
            return done(err);
          } else {
            console.info("Made a new user.");
            var rec = {
              name: data.name,
              email: data.email,
              gender: data.gender,
              picture: data.picture,
              link: data.link,
              birthday: data.birthday,
              admin:false
            }
            rec[data.source] = data.id;

            var newUser = new User(rec);
            console.log(JSON.stringify(newUser));

            newUser.save(function(err){
              req.flash('success', { msg: 'Your' + data.source +' account has been linked.' });
              return done(err, user);
            });
          }
        });
      }
    });
  }
}

// Sign in with Facebook
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: config.protocol + config.domain + "/auth/facebook/callback",
  profileFields: ['name', 'email', 'gender', 'location', 'link', 'birthday', 'age_range'],
  passReqToCallback: true
}, function(req, accessToken, refreshToken, data, done) {
    console.log("FACEEBOOK CALLBACK!!!");
    console.log(JSON.stringify(data));

    var profile = data._json;

    var userdata = {
    'source': 'facebook',
    'id': profile.id,
    'name': profile.first_name + " " + profile.last_name,
    'link': profile.link,
    'email': profile.email,
    'birthday': profile.birthday,
    'gender': profile.gender
    };

    if(profile.age_range) {
      if(profile.age_range.min && !profile.age_range.max) {
        userdata.age_range = profile.age_range.min + " or over";
      } else if(!profile.age_range.min && profile.age_range.max) {
        userdata.age_range = "Under " + profile.age_range.max;
      } else {
        userdata.age_range = profile.age_range.min + " - " + profile.age_range.max;
      }
    }

    var auth_id_qry = {'facebook': profile.id}
    process_auth_data(req, userdata, auth_id_qry, done);

  })
);
