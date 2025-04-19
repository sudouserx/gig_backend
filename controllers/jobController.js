const Job = require('../models/Job');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/jobs';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
  }
});

// File filter - only accept images and documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and document files are allowed!'));
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: fileFilter
});

/**
 * @desc    Get all jobs with filtering options
 * @route   GET /api/jobs
 * @access  Public
 */
const getJobs = async (req, res) => {
  try {
    const { employerId, appliedBy, jobId, category, location, tags, isRemote, deadline } = req.query;
    const filter = {};

    // Apply filters if provided
    if (jobId) {
      filter._id = jobId;
    }
    
    if (employerId) {
      filter.employerId = employerId;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (location) {
      filter.location = location;
    }

    if (tags) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    if (isRemote !== undefined) {
      filter.isRemote = isRemote === 'true';
    }
    
    if (deadline) {
      filter.deadline = { $gte: new Date(deadline) };
    }
    
    // Handle the appliedBy filter (jobs that an employee has applied to)
    let jobs;
    if (appliedBy) {
      jobs = await Job.find({ applicants: appliedBy })
        .populate('employerId', 'fullName email companyName')
        .sort({ createdAt: -1 });
    } else {
      jobs = await Job.find(filter)
        .populate('employerId', 'fullName email companyName')
        .sort({ createdAt: -1 });
    }
    
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get employer's jobs
 * @route   GET /api/employers/:employerId/jobs
 * @access  Private
 */
const getEmployerJobs = async (req, res) => {
  try {
    // Check if user is requesting their own jobs or has admin privileges
    if (req.user.role !== 'employer' && 
        req.user._id.toString() !== req.params.employerId &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these jobs'
      });
    }

    const jobs = await Job.find({ employerId: req.params.employerId })
      .populate('employerId', 'fullName email companyName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get a single job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employerId', 'fullName email companyName')
      .populate('applicants', 'fullName email');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private (Employers only)
 */
const createJob = async (req, res) => {
  // Use multer middleware for file upload
  const uploadmediaUrls = upload.array('mediaUrls', 5); // Allow up to 5 files
  
  uploadmediaUrls(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      // Check if user is an employer
      if (req.user.role !== 'employer') {
        return res.status(403).json({
          success: false,
          message: 'Only employers can create job postings'
        });
      }
      
      const {
        title,
        description,
        category,
        tags,
        location,
        isRemote,
        deadline,
        budget
      } = req.body;
      
      // Process tags if provided as a string
      let processedTags = [];
      if (tags) {
        // Check if tags is a string that represents an array
        if (tags.startsWith('[') && tags.endsWith(']')) {
          processedTags = JSON.parse(tags);
        } else {
          processedTags = tags.split(',').map(tag => tag.trim());
        }
      }

      // Process file paths
      const mediaUrls = req.files ? 
        req.files.map(file => `${req.protocol}://${req.get('host')}/${file.path}`) : 
        [];
      
      // Create new job
      const job = await Job.create({
        title,
        description,
        category,
        tags: processedTags,
        location,
        isRemote: isRemote === 'true',
        deadline,
        budget: budget ? parseFloat(budget) : undefined,
        mediaUrls,
        employerId: req.body.employerId || req.user._id
      });
      
      res.status(201).json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });
};

/**
 * @desc    Update a job
 * @route   PUT /api/jobs/:id
 * @access  Private (Job creator only)
 */
const updateJob = async (req, res) => {
  // Use multer middleware for file upload
  const uploadmediaUrls = upload.array('mediaUrls', 5); // Allow up to 5 files
  
  uploadmediaUrls(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      let job = await Job.findById(req.params.id);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Verify ownership
      if (job.employerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,   
          message: 'You are not authorized to update this job'
        });
      }
      
      const updateData = { ...req.body };
      
      // Process tags if provided as a string
      if (updateData.tags) {
        // Check if tags is a string that represents an array
        if (typeof updateData.tags === 'string') {
          if (updateData.tags.startsWith('[') && updateData.tags.endsWith(']')) {
            updateData.tags = JSON.parse(updateData.tags);
          } else {
            updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
          }
        }
      }
      
      // Process isRemote if provided
      if (updateData.isRemote !== undefined) {
        updateData.isRemote = updateData.isRemote === 'true';
      }
      
      // Process budget if provided
      if (updateData.budget) {
        updateData.budget = parseFloat(updateData.budget);
      }
      
      // Process file paths and add to existing files
      if (req.files && req.files.length > 0) {
        const newmediaUrls = req.files.map(file => 
          `${req.protocol}://${req.get('host')}/${file.path}`
        );
        
        updateData.mediaUrls = [...(job.mediaUrls || []), ...newmediaUrls];
      }
      
      // Update job
      job = await Job.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });
};

/**
 * @desc    Delete a job
 * @route   DELETE /api/jobs/:id
 * @access  Private (Job creator only)
 */
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Verify ownership
    if (job.employerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this job'
      });
    }
    
    // Remove media files
    if (job.mediaUrls && job.mediaUrls.length > 0) {
      job.mediaUrls.forEach(fileUrl => {
        try {
          const filePath = fileUrl.replace(`${req.protocol}://${req.get('host')}/`, '');
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    
    await job.deleteOne();
    
    res.json({
      success: true,
      message: 'Job removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Apply for a job
 * @route   POST /api/jobs/:id/apply
 * @access  Private (Employees only)
 */
const applyForJob = async (req, res) => {
  try {
    // Check if user is an employee
    if (req.user.role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Only employees can apply for jobs'
      });
    }
    
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if job is still active
    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }
    
    // Check if job deadline has passed
    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline for this job has passed'
      });
    }
    
    // Check if user has already applied
    if (job.applicants.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }
    
    // Add user to applicants
    job.applicants.push(req.user._id);
    await job.save();
    
    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: job
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getJobs,
  getEmployerJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob
};