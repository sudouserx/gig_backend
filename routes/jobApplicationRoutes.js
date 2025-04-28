const { protect, authorize } = require('../middleware/auth');
const express = require('express');
const router = express.Router();

const {
    getAppliedJobs,
    getJobApplicants,
    applyForJob,
    updateApplicationStatus
} = require('../controllers/jobApplicationController');

// Public routes
router.get('/:applicantId',protect, getAppliedJobs);
router.get('/:jobId',protect, getJobApplicants); 
router.post('/apply',protect, applyForJob);
router.put('/:applicationId',protect, updateApplicationStatus);


module.exports = router;