import { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "Software / IT", label: "Software / IT", desc: "Dev, Cloud & Systems" },
  { id: "Video / Graphics", label: "Video / Graphics", desc: "Design, 3D & Editing" },
  { id: "Finance & Accounting", label: "Finance & Accounting", desc: "Audit, Tax & Banking" },
  { id: "Sales & Marketing", label: "Sales & Marketing", desc: "SEO, Growth & Ads" },
  { id: "Healthcare", label: "Healthcare", desc: "Medical & Clinical" },
  { id: "General / Other", label: "General / Other", desc: "Miscellaneous fields" },
];

export default function PreferencesModal({ user, onClose, onSave }) {
  const [selectedCategories, setSelectedCategories] = useState(
    user?.subscribedCategories || []
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled ?? true
  );
  const [saving, setSaving] = useState(false);

  // Sync local state when user prop loads/updates
  useEffect(() => {
    if (user) {
      setSelectedCategories(user.subscribedCategories || []);
      setNotificationsEnabled(user.notificationsEnabled ?? true);
    }
  }, [user]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleCategory = (categoryName) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleToggleAll = () => {
    if (selectedCategories.length === CATEGORIES.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(CATEGORIES.map((c) => c.label));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        telegramId: user?.telegramId || user?.id,
        categories: selectedCategories,
        notificationsEnabled,
      });
      onClose();
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const isAllSelected = selectedCategories.length === CATEGORIES.length;

  return (
    /* Outer Backdrop: Fully transparent background with full-screen centering */
    <div
      onClick={onClose}
      className="fixed inset-0 min-h-screen z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Modal Box: Clean white floating card centered vertically */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-200/80 my-auto transition-all transform"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Notification Preferences
            </h2>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Connected as @{user?.username || user?.first_name || user?.firstName || "User"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-all"
            aria-label="Close modal"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Master Switch Card */}
        <div className="flex items-center justify-between bg-slate-50/80 hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 transition-all">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-slate-800 block">
              Direct Messaging Alerts
            </span>
            <span className="text-xs text-slate-500 block">
              Receive instant updates directly via Telegram DM
            </span>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              notificationsEnabled ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                notificationsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Category Pickers */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Preferred Fields
            </label>
            <button
              type="button"
              onClick={handleToggleAll}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat.label);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.label)}
                  className={`group cursor-pointer p-3.5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between relative ${
                    isChecked
                      ? "border-indigo-600/90 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-600/30"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-semibold transition-colors ${
                        isChecked ? "text-indigo-950" : "text-slate-700"
                      }`}
                    >
                      {cat.label}
                    </span>

                    {/* Checkmark Indicator */}
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isChecked
                          ? "bg-indigo-600 text-white scale-100"
                          : "border border-slate-300 bg-white opacity-40 group-hover:opacity-70"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal mt-1">
                    {cat.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}