var mongoose = require('mongoose');

var schemaOptions = {
  timestamps: true,
};

var orgSchema = new mongoose.Schema({
  name: { type : String , required : true},
  location: String,
  tagline: String,
  about: String,
  heroImg: String,
  iconImg: String,
  website: String,
  facebook: String,
  twitter: String,
  survey: String,
  subdomain: { type : String , unique : true, required : true, dropDups: true, index:true }
}, schemaOptions);

var Org = mongoose.model('Org', orgSchema);

module.exports = Org;
