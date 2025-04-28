const User = require('../models/User');
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');

// get applied jobs
const getAppliedJobs = async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    const applications = await JobApplication.find({ applicantId: applicantId }).populate('jobId');
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applied jobs', error });
  }
};

// get job applicants

const getJobApplicants = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const applicants = await JobApplication.find({ jobId: jobId }).populate('applicantId');
    res.status(200).json(applicants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job applicants', error });
  }
}

// apply for a job

const applyForJob = async (req, res) => {
  try {
    const { jobId, applicantId, resumeUrl } = req.body;

    // Check if the applicant has already applied for the job
    const existingApplication = await JobApplication.findOne({ jobId, applicantId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    const newApplication = new JobApplication({
      jobId,
      applicantId,
      resumeUrl
    });

    await newApplication.save();

    // Update the job's applicants list
    await Job.findByIdAndUpdate(jobId, { $addToSet: { applicants: applicantId } });

    res.status(201).json(newApplication);
  } catch (error) {
    res.status(500).json({ message: 'Error applying for job', error });
  }
}

// update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.applicationId;

    const updatedApplication = await JobApplication.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    );

    res.status(200).json(updatedApplication);
  } catch (error) {
    res.status(500).json({ message: 'Error updating application status', error });
  }
}


module.exports = {
  getAppliedJobs,
  getJobApplicants,
  applyForJob,
  updateApplicationStatus
};
// Note: Ensure to handle the resume file upload separately and save the URL in the database.
// This code assumes that you have a file upload middleware in place to handle the resume file upload.
