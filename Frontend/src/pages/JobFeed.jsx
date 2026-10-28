
import { useState, useEffect } from "react";
import {
  Search,
  X,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Mail,
  Phone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Moon,
  Sun,
  MapPin,
  Tags,
  FileText,
  ArrowUpRight,
  LoaderCircle,
  Inbox,
} from "lucide-react";

import { fetchJobs } from "../api/jobService";

const CATEGORIES = [
  "All",
  "Software / IT",
  "Video / Graphics",
  "Finance & Accounting",
  "Sales & Marketing",
  "Healthcare",
  "General / Other",
];

const getTelegramUrl = (job) => {
  if (!job) return "https://t.me";

  if (job.postUrl) return job.postUrl;

  const username = job.channelUsername || job.sourceName;

  if (username && username.startsWith("@")) {
    const cleanUsername = username.replace("@", "");

    return job.messageId
      ? `https://t.me/${cleanUsername}/${job.messageId}`
      : `https://t.me/${cleanUsername}`;
  }

  return "https://t.me";
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function JobFeed({ dark, setDark }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [activeJob, setActiveJob] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await fetchJobs({
          page,
          limit: 15,
          search,
          category: selectedCategory,
          signal: controller.signal,
        });

        if (!isCurrent) return;

        setJobs(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalJobs(res.count || 0);
        setError(null);
      } catch (err) {
        if (!isCurrent || err.name === "AbortError") return;

        setError("Unable to load jobs. Please check your connection and try again.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, selectedCategory, page]);

  useEffect(() => {
    if (!activeJob) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActiveJob(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [activeJob]);

  const pageBg = dark
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-50 text-slate-900";

  const panel = dark
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";

  const muted = dark ? "text-slate-400" : "text-slate-500";

  const inputStyle = dark
    ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400";

  return (
    <main className={`min-h-screen ${pageBg} transition-colors duration-200`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* Page heading */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
              <BriefcaseBusiness size={14} />
              Your next opportunity starts here
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Explore opportunities
            </h1>

            <p className={`mt-2 max-w-2xl text-sm sm:text-base ${muted}`}>
              Discover job vacancies collected from Telegram channels in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDark((prev) => !prev)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:opacity-80 ${panel}`}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </header>

        {/* Search and filters */}
        <section className={`mb-8 rounded-2xl border p-4 shadow-sm sm:p-6 ${panel}`}>
          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-indigo-500" />
            <h2 className="font-semibold">Find your next role</h2>
          </div>

          <div className="relative">
            <Search
              size={19}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${muted}`}
            />

            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search jobs, skills, or companies..."
              aria-label="Search jobs"
              className={`w-full rounded-xl border py-3 pl-11 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${inputStyle}`}
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition hover:bg-slate-200/50 ${muted}`}
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const selected = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setPage(1);
                  }}
                  aria-pressed={selected}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition sm:text-sm ${
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : dark
                        ? "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {/* Results heading */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              {search ? "Search results" : "Latest vacancies"}
            </h2>

            <p className={`mt-1 text-sm ${muted}`}>
              {loading
                ? "Finding relevant opportunities..."
                : `${totalJobs.toLocaleString()} ${totalJobs === 1 ? "job" : "jobs"} found`}
            </p>
          </div>

          {selectedCategory !== "All" && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setPage(1);
              }}
              className="text-sm font-medium text-indigo-500 hover:text-indigo-400"
            >
              Clear category
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => setPage((prev) => prev)}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`animate-pulse rounded-2xl border p-5 ${panel}`}
              >
                <div className="mb-5 flex justify-between gap-3">
                  <div className="h-6 w-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="mb-3 h-5 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mb-6 h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mb-2 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mb-6 h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className={`rounded-2xl border px-5 py-16 text-center ${panel}`}>
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
              <Inbox size={27} className={muted} />
            </div>

            <h3 className="text-lg font-bold">No jobs found</h3>

            <p className={`mx-auto mt-2 max-w-md text-sm ${muted}`}>
              Try another search term or choose a different category to discover more opportunities.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setPage(1);
              }}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Reset filters
            </button>
          </div>
        ) : (
          /* Job cards */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <article
                key={job._id}
                className={`group flex min-w-0 flex-col justify-between rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${panel} ${
                  dark ? "hover:border-slate-600" : "hover:border-indigo-200"
                }`}
              >
                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="inline-flex max-w-[70%] items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      <Tags size={13} />
                      <span className="truncate">{job.category || "General / Other"}</span>
                    </span>

                    <span className={`flex shrink-0 items-center gap-1 text-xs ${muted}`}>
                      <CalendarDays size={13} />
                      {formatDate(job.createdAt)}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold leading-snug transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {job.title || "Untitled vacancy"}
                  </h3>

                  <p className={`mt-2 flex items-center gap-2 text-sm ${muted}`}>
                    <Building2 size={15} className="shrink-0" />
                    <span className="truncate">{job.company || "Company not specified"}</span>
                  </p>

                  {job.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {job.tags.slice(0, 4).map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className={`rounded-md px-2 py-1 text-xs ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {(job.contactEmail || job.contactPhone) && (
                    <div className={`mt-4 space-y-2 border-t pt-4 text-xs ${dark ? "border-slate-800" : "border-slate-100"} ${muted}`}>
                      {job.contactEmail && (
                        <p className="flex min-w-0 items-center gap-2">
                          <Mail size={14} className="shrink-0" />
                          <span className="truncate">{job.contactEmail}</span>
                        </p>
                      )}

                      {job.contactPhone && (
                        <p className="flex items-center gap-2">
                          <Phone size={14} className="shrink-0" />
                          <span>{job.contactPhone}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveJob(job)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    View details
                    <ArrowUpRight size={16} />
                  </button>

                  <a
                    href={getTelegramUrl(job)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${dark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <ExternalLink size={15} />
                    Original Telegram post
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && jobs.length > 0 && totalPages > 1 && (
          <nav
            aria-label="Job results pagination"
            className={`mt-8 flex flex-wrap items-center justify-center gap-4 rounded-2xl border p-4 ${panel}`}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className={`text-sm font-medium ${muted}`}>
              Page <span className="font-bold">{page}</span> of{" "}
              <span className="font-bold">{totalPages}</span>
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </nav>
        )}

        {/* Job details modal */}
        {activeJob && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setActiveJob(null);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="job-modal-title"
              className={`max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border p-5 shadow-2xl sm:rounded-2xl sm:p-7 ${panel}`}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="mb-3 inline-flex rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {activeJob.category || "General / Other"}
                  </span>

                  <h2 id="job-modal-title" className="break-words text-xl font-bold sm:text-2xl">
                    {activeJob.title || "Untitled vacancy"}
                  </h2>

                  <p className={`mt-2 flex items-center gap-2 text-sm ${muted}`}>
                    <Building2 size={16} />
                    {activeJob.company || "Company not specified"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveJob(null)}
                  aria-label="Close job details"
                  className={`shrink-0 rounded-xl border p-2 transition ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}
                >
                  <X size={19} />
                </button>
              </div>

              <div className={`mb-5 flex flex-wrap gap-3 text-xs ${muted}`}>
                {activeJob.sourceName && (
                  <span className={`rounded-lg px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                    Source: {activeJob.sourceName}
                  </span>
                )}

                <span className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <CalendarDays size={13} />
                  {formatDate(activeJob.createdAt)}
                </span>
              </div>

              {activeJob.tags?.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {activeJob.tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className={`rounded-lg px-2.5 py-1.5 text-xs ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className={`rounded-xl border p-4 sm:p-5 ${dark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <FileText size={16} className="text-indigo-500" />
                  Job description
                </h3>

                <p className={`whitespace-pre-wrap break-words text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  {activeJob.rawText || "No additional job description is available."}
                </p>
              </div>

              {(activeJob.contactEmail || activeJob.contactPhone) && (
                <div className="mt-5 space-y-3">
                  <h3 className="text-sm font-semibold">Contact information</h3>

                  {activeJob.contactEmail && (
                    <a
                      href={`mailto:${activeJob.contactEmail}`}
                      className="flex min-w-0 items-center gap-3 text-sm text-indigo-500 hover:underline"
                    >
                      <Mail size={16} className="shrink-0" />
                      <span className="break-all">{activeJob.contactEmail}</span>
                    </a>
                  )}

                  {activeJob.contactPhone && (
                    <p className={`flex items-center gap-3 text-sm ${muted}`}>
                      <Phone size={16} />
                      {activeJob.contactPhone}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={getTelegramUrl(activeJob)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Open original post
                  <ExternalLink size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => setActiveJob(null)}
                  className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100"}`}
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}