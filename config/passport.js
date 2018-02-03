var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
// var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
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
    callbackURL: config.domain + "/auth/linkedin/callback",
    scope: ['r_emailaddress', 'r_basicprofile'],
    state: true,
    profileFields: [
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

    process_auth_data(req, userdata, auth_id_qry, done);
}));


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: config.domain + "/auth/google/callback",
    profileFields: ['name', 'email', 'gender', 'location', 'link', 'birthday', 'age_range'],
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, data, done) {
    console.log("<<<GOOGLE REPLY>>>>");
    profile = data._json;
    console.info(profile);

    var userdata = {
      'source': 'google',
      'id': profile.id,
      'name': profile.name.givenName + " " + profile.name.familyName,
      'link': profile.link,
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
    process_auth_data(req, data, auth_id_qry, done);

  })
);


function process_auth_data(req, data, auth_id_qry, done){
  if(req.user){
    console.info("Linking a logged in user.");
    User.findOne(auth_id_qry, function(err, user) {
      if(user){
        console.info(data.source + " account already linked to user.");
        req.flash('error', { msg: 'That ' + data.source + ' account has already been linked.' });
        done(err);
      }else{
        console.info("Updating our records with anything new from the user.");
        User.findById(req.user.id, function(err, user) {
          user.name = user.name || data.name;
          user.gender = user.gender || data.gender;
          user.picture = user.picture || data.picture;
          user.link = user.link || data.link;
          user.birthday = user.birthday || data.birthday;
          user.age_range = user.age_range || data.age_range;

          user[data.source] = data.id;
          user.save(function(err) {
            req.flash('success', { msg: 'Your' + data.source + ' account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne(auth_id_qry, function(err, user) {
      if(user){
        console.info("Found the right user");
        done(err, user);
      } else {
        User.findOne({ email: data.email }, function(err, user) {
          if(user){
            console.info("Found the wrong user.");
            req.flash('error', { msg: user.email + ' is already associated with another account.' });
            return done(err);
          } else {
            console.info("Made a new user.");
            var newUser = new User({
              name: data.name,
              email: data.email,
              gender: data.gender,
              picture: data.picture,
              link: data.link,
              birthday: data.birthday,
              admin:false
            });
            newUser[data.source] = data.id;

            newUser.save(function(err){
              req.flash('success', { msg: 'Your' + data.source +' account has been linked.' });
              done(err, user);
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
  callbackURL: '/auth/facebook/callback',
  profileFields: ['name', 'email', 'gender', 'location', 'link', 'birthday', 'age_range'],
  passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, done) {
  console.log("FACEEBOOK CALLBACK!!!");
  console.log(JSON.stringify(profile));


  if (req.user) {
    User.findOne({ facebook: profile.id }, function(err, user) {
      if (user) {
        req.flash('error', { msg: 'There is already an existing account linked with Facebook that belongs to you.' });
        done(err);
      } else {
        User.findById(req.user.id, function(err, user) {
          user.name = user.name || profile.name.givenName + ' ' + profile.name.familyName;
          user.gender = user.gender || profile._json.gender;
          user.picture = user.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
          user.facebook = profile.id;
          user.link = user.link || profile._json.link;
          user.birthday = user.birthday || profile._json.birthday;
          user.age_range = user.age_range || profile._json.age_range

          if(profile._json.age_range) {
            if(profile._json.age_range.min && !profile._json.age_range.max) {
              user.age_range = profile._json.age_range.min + " or over";
            } else if(!profile._json.age_range.min && profile._json.age_range.max) {
              user.age_range = "Under " + profile._json.age_range.max;
            } else {
              user.age_range = profile._json.age_range.min + " - " + profile._json.age_range.max;
            }
          }

          user.save(function(err) {
            req.flash('success', { msg: 'Your Facebook account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ facebook: profile.id }, function(err, user) {
      if (user) {
        return done(err, user);
      }
      User.findOne({ email: profile._json.email }, function(err, user) {
        if (user) {
          req.flash('error', { msg: user.email + ' is already associated with another account.' });
          done(err);
        } else {
          var newUser = new User({
            name: profile.name.givenName + ' ' + profile.name.familyName,
            email: profile._json.email,
            gender: profile._json.gender,
            location: profile._json.location && profile._json.location.name,
            picture: 'https://graph.facebook.com/' + profile.id + '/picture?type=large',
            facebook: profile.id,
            link: profile._json.link,
            birthday: profile._json.birthday,
            admin:false
          });

          if(profile._json.age_range) {
            if(profile._json.age_range.min && !profile._json.age_range.max) {
              newUser.age_range = profile._json.age_range.min + " or over";
            } else if(!profile._json.age_range.min && profile._json.age_range.max) {
              newUser.age_range = "Under " + profile._json.age_range.max;
            } else {
              newUser.age_range = profile._json.age_range.min + " - " + profile._json.age_range.max;
            }
          }

          newUser.save(function(err) {
            done(err, newUser);
          });
        }
      });
    });
  }
}));

// Sign in with Twitter
/*
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: '/auth/twitter/callback',
  passReqToCallback: true
}, function(req, accessToken, tokenSecret, profile, done) {
  if (req.user) {
    User.findOne({ twitter: profile.id }, function(err, user) {
      if (user) {
        req.flash('error', { msg: 'There is already an existing account linked with Twitter that belongs to you.' });
        done(err);
      } else {
        User.findById(req.user.id, function(err, user) {
          user.name = user.name || profile.displayName;
          user.location = user.location || profile._json.location;
          user.picture = user.picture || profile._json.profile_image_url_https;
          user.twitter = profile.id;
          user.save(function(err) {
            req.flash('success', { msg: 'Your Twitter account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ twitter: profile.id }, function(err, existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }
      // Twitter does not provide an email address, but email is a required field in our User schema.
      // We can "fake" a Twitter email address as follows: username@twitter.com.
      // Ideally, it should be changed by a user to their real email address afterwards.
      // For example, after login, check if email contains @twitter.com, then redirect to My Account page,
      // and restrict user's page navigation until they update their email address.
      var newUser = new User({
        name: profile.displayName,
        email: profile.username + '@twitter.com',
        location: profile._json.location,
        picture: profile._json.profile_image_url_https,
        twitter: profile.id
      });
      newUser.save(function(err) {
        done(err, newUser);
      });
    });
  }
}));
*/
