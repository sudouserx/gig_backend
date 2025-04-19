const express = require('express');
const router = express.Router();
const { 
  getJobs, 
  getJobById,
  getEmployerJobs,
  createJob, 
  updateJob, 
  deleteJob,
  applyForJob
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected routes
router.post('/', protect, createJob);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);
router.post('/:id/apply', protect, applyForJob);

// Add employer specific routes
router.get('/employers/:employerId/jobs', protect, getEmployerJobs);

module.exports = router;