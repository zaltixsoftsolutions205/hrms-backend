const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  jobPosting:  { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, trim: true, default: '' },
  phone:       { type: String, trim: true, default: '' },
  stage:       { type: String, enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'], default: 'applied' },
  resumeUrl:   { type: String, default: '' },
  notes:       { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Applicant', applicantSchema);
