var mongoose = require('mongoose');

var schemaOptions = {
  timestamps: true,
};

var applicationSchema = new mongoose.Schema({
  org: {type: mongoose.Schema.Types.ObjectId, ref: 'Org'},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  responsesJSON: String,
  accepted: { type : Boolean , required : true},
  reviewed: { type : Boolean , required : true}
}, schemaOptions);

var Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
