const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  voter_id: { type: String, required: true },
  booth_id: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Resolved'] },
  resolutionProofUrl: { type: String },
  adminComments: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [long, lat] for 3D mapping
  }
}, { timestamps: true });

complaintSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);
