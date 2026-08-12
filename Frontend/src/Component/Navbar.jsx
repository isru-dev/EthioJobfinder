import { useState, useCallback } from "react";
import TelegramLoginButton from "./TelegramLoginButton";
import PreferencesModal from "./PreferencesModal";

export default function Navbar({ user, setUser }) {
  const [showPreferences, setShowPreferences] = useState(false);

  const handleTelegramAuth = useCallback(
    async (telegramUser) => {
      try {
        const res = await fetch(`/api/auth/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(telegramUser),
        });

        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          localStorage.setItem("ethio_job_user", JSON.stringify(data.user));
          setShowPreferences(true); // Open preferences immediately on login
        } else {
          alert(data.error || "Login failed");
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    },
    [setUser]
  );

  const handleSavePreferences = async (prefPayload) => {
    try {
      const res = await fetch(`/api/user/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefPayload),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("ethio_job_user", JSON.stringify(data.user));
        setShowPreferences(false);
      } else {
        alert(data.error || "Failed to update preferences.");
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("ethio_job_user");
  };

  return (
    <nav className="flex justify-between items-center py-4 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
        <span>Ethio Job Explorer 💼</span>
      </div>

      <div>
        {user ? (
          /* When logged in, show Preferences & User Profile */
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreferences(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              ⚙️ <span>Alert Preferences</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">
              {user?.photo_url && (
                <img
                  src={user.photo_url}
                  alt="Avatar"
                  className="w-4 h-4 rounded-full object-cover"
                />
              )}
              <span>{user?.first_name || user?.firstName || "User"}</span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium pl-1 cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          /* When logged out, show Telegram Login Button */
          <TelegramLoginButton
            botName="EJobExplore_bot"
            onAuth={handleTelegramAuth}
          />
        )}
      </div>

      {/* Preferences Modal */}
      {showPreferences && user && (
        <PreferencesModal
          user={user}
          onClose={() => setShowPreferences(false)}
          onSave={handleSavePreferences}
        />
      )}
    </nav>
  );
}