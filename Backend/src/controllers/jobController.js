import { Job } from "../models/Job.js";

// @desc    Get all jobs with full-text search, filter, and pagination
// @route   GET /api/v1/jobs
export const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, category, source } = req.query;

    // Build dynamic query filter
    let query = {};

    // 1. Text Search across title, category, tags, rawText
    if (search) {
      query.$text = { $search: search };
    }

    // 2. Filter by Category if provided
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    // 3. Filter by Source (telegram vs web)
    if (source) {
      query.sourceType = source;
    }

    // Execute query with pagination
    let jobsQuery = Job.find(query);

    // Sort by text relevance score if search is present, else newest first
    if (search) {
      jobsQuery = jobsQuery
        .select({ score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } });
    } else {
      jobsQuery = jobsQuery.sort({ createdAt: -1 });
    }

    const jobs = await jobsQuery.skip(skip).limit(limit);
    const totalJobs = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      count: jobs.length,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
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