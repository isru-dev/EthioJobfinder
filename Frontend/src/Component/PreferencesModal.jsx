import { useState, useEffect } from "react";

const CATEGORIES = [
  "Software / IT",
  "Video / Graphics",
  "Finance & Accounting",
  "Sales & Marketing",
  "Healthcare",
  "General / Other",
];

export default function PreferencesModal({ user, onClose, onSave }) {
  const [selectedCategories, setSelectedCategories] = useState(
    user.subscribedCategories || []
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user.notificationsEnabled ?? true
  );
  const [saving, setSaving] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleToggleAll = () => {
    if (selectedCategories.length === CATEGORIES.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...CATEGORIES]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      telegramId: user.telegramId || user.id,
      categories: selectedCategories,
      notificationsEnabled,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing when clicking inside
        className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100"
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Notification Preferences
            </h2>
            <p className="text-xs text-slate-500">
              Logged in as @{user.username || user.first_name || user.firstName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
          >
            ✕
          </button>
        </div>

        {/* Master Switch */}
        <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-sm font-semibold text-slate-700">
            Enable Direct DM Alerts
          </span>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
          />
        </div>

        {/* Category Pickers */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Preferred Fields
            </label>
            <button
              type="button"
              onClick={handleToggleAll}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              {selectedCategories.length === CATEGORIES.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1 max-h-60 overflow-y-auto pr-1">
            {CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                    isChecked
                      ? "border-indigo-600 bg-indigo-50/60 text-indigo-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                      isChecked
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isChecked ? "Subscribed" : "Off"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}