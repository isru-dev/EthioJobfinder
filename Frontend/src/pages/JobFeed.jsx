import { useState, useEffect } from "react";
import { fetchJobs } from "../api/jobService";

const CATEGORIES = [
  "All",
  "Software / IT",
  "Finance & Accounting",
  "Sales & Marketing",
  "Healthcare",
  "General / Other",
];

export default function JobFeed() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Selected job for detailed modal
  const [activeJob, setActiveJob] = useState(null);

  // Fetch jobs on state change
  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      try {
        const res = await fetchJobs({
          page,
          limit: 9,
          search,
          category: selectedCategory,
        });
        setJobs(res.data);
        setTotalPages(res.totalPages);
        setTotalJobs(res.count);
        setError(null);
      } catch (err) {
        setError("Failed to fetch jobs. Is your backend server running?");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search requests slightly
    const timer = setTimeout(() => {
      loadJobs();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, page]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Ethio Job Explorer 💼
          </h1>
          <p className="text-slate-600 text-lg">
            Real-time aggregated vacancies powered by live Telegram streams
          </p>
        </header>

        {/* Controls: Search & Category Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title, skills, or tags (e.g., React, Accountant)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset to page 1 on new query
              }}
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 placeholder-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-center font-medium">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-pulse"
              >
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="h-20 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="text-xl font-bold text-slate-700">No jobs found</h3>
            <p className="text-slate-500">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          /* Job Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Metadata Header */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg">
                      {job.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Company */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                      {job.title}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      🏢 {job.company}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.tags?.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Contact Chips */}
                  <div className="pt-2 text-xs space-y-1 text-slate-600">
                    {job.contactEmail && (
                      <div className="truncate">✉️ {job.contactEmail}</div>
                    )}
                    {job.contactPhone && (
                      <div>📞 {job.contactPhone}</div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <button
                  onClick={() => setActiveJob(job)}
                  className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  View Description
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 pt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-sm disabled:opacity-50 hover:bg-slate-50 transition-all"
            >
              Previous
            </button>

            <span className="text-sm font-semibold text-slate-600">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-sm disabled:opacity-50 hover:bg-slate-50 transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Full Job Modal */}
        {activeJob && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100">
              
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeJob.title}</h2>
                  <p className="text-slate-500 font-medium">🏢 {activeJob.company}</p>
                </div>
                <button
                  onClick={() => setActiveJob(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Source Tag */}
              <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium">
                Source: {activeJob.sourceName}
              </div>

              {/* Raw Job Description */}
              <div className="bg-slate-50 p-4 rounded-xl text-slate-700 whitespace-pre-wrap font-mono text-xs leading-relaxed border border-slate-200">
                {activeJob.rawText}
              </div>

              <button
                onClick={() => setActiveJob(null)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}