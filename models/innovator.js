// /models/innovator.js
const mongoose = require("mongoose");

const innovatorSchema = new mongoose.Schema({
   name: {
  type: String,
  required: true
 },
  gender: {
  type: String,
  required: true
},
  innovation: {
  type: String,
  required: true
},
  scheme: String,
  state: String,
  applicationNumber:  {
  type: String,
  required: true
},
  priorityDate: String,
  status: String,
  patentNo: String,
  dateOfGrant: String,
  filedThrough: String
});

const Innovator = mongoose.model("Innovator", innovatorSchema);
module.exports = Innovator;
