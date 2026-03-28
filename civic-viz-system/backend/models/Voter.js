const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  voter_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  father_name: { type: String },
  house_no: { type: String },
  age: { type: Number },
  gender: { type: String },
  booth_id: { type: String, required: true },
  area: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Voter', voterSchema);
