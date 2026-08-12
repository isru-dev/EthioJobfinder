import { getJobTelegramUrl } from "../../utils/telegram";

export const JobCard = ({ job }) => {
  const telegramUrl = getJobTelegramUrl(job);

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-shadow">
      <div>
        {/* Category & Source Tag */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
            {job.category || "General"}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {job.sourceName || "Telegram"}
          </span>
        </div>

        {/* Job Title & Company */}
        <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{job.company}</p>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: View Telegram Post Link */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {job.createdAt
            ? new Date(job.createdAt).toLocaleDateString()
            : "Recently added"}
        </span>

        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
        >
          <span>View Original Post</span>
          {/* Telegram Icon */}
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        </a>
      </div>
    </div>
  );
};