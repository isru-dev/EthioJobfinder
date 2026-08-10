import { Job } from "../models/Job.js";

// @desc    Get all jobs with full-text search, filter, and pagination
// @route   GET /api/v1/jobs
// Inside src/controllers/jobController.js
export const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, category, source, days } = req.query;

    let query = {};

    // Filter by date range (default to last 7 days if not specified)
    const daysLimit = parseInt(days, 10) || 7;
    const dateBoundary = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: dateBoundary };

    // Search & additional filters
    if (search) query.$text = { $search: search };
    if (category) query.category = { $regex: category, $options: "i" };
    if (source) query.sourceType = source;

    // Execute query sorted by newest
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalJobs = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      count: jobs.length,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single job by ID
// @route   GET /api/v1/jobs/:id
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job vacancy not found",
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};