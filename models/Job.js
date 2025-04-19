const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    required: false
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  deadline: {
    type: Date,
    required: true
  },
  budget: {
    type: Number
  },
  mediaUrls: [{
    type: String // URLs to uploaded files
  }],
  employerId: {
    type: String,
    required: true
  },
  applicants: [{
    type: String,
    default: []
  }],
  status: {
    type: String,
    enum: ['active', 'filled', 'expired'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);